import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { createTicketCreatedEmbed, createTicketClaimedEmbed, createTicketClosedEmbed, createTicketReopenedEmbed, createTicketLockedEmbed, createTicketUnlockedEmbed, createErrorEmbed, createSuccessEmbed, createWorkingHoursEmbed } from '../utils/embeds.js';
import { canManageTickets } from '../utils/permissions.js';
import { buildTicketPermissions } from '../utils/permissions.js';
import { generateTicketId } from '../utils/ticketId.js';
import { getAutoResponse } from '../services/aiResponseService.js';
import { getOrCreateGuildSettings, createTicket, claimTicket, closeTicket, reopenTicket, lockTicket, unlockTicket, getUserOpenTickets, getTicketByChannelId, getTicketByTicketId } from '../services/ticketService.js';
import { logAction } from '../services/auditService.js';
import { generateTranscript } from '../services/transcriptService.js';
import { COMPONENT_IDS, TICKET_TYPES, REOPEN_WINDOW_HOURS } from '../config/constants.js';
import { isWorkingHours } from '../utils/errors.js';

/**
 * Ticket component handlers
 * Maintained via Context7 for consistency
 */

/**
 * Fetch all messages from a channel (Discord API limit is 100 per request)
 */
async function fetchAllMessages(channel) {
  const { Collection } = await import('discord.js');
  const messages = new Collection();
  let lastId = null;
  let hasMore = true;

  while (hasMore) {
    const options = { limit: 100 };
    if (lastId) {
      options.before = lastId;
    }

    const batch = await channel.messages.fetch(options);
    
    if (batch.size === 0) {
      hasMore = false;
    } else {
      batch.forEach(msg => messages.set(msg.id, msg));
      lastId = batch.last().id;
      
      // If we got less than 100 messages, we've reached the end
      if (batch.size < 100) {
        hasMore = false;
      }
    }
  }

  return messages;
}

export async function handleTicketSelect(interaction) {
  const ticketType = interaction.values[0];
  
  if (!Object.values(TICKET_TYPES).includes(ticketType)) {
    return interaction.reply({
      embeds: [createErrorEmbed('Invalid ticket type selected.')],
      flags: MessageFlags.Ephemeral
    });
  }

  try {
    const settings = await getOrCreateGuildSettings(interaction.guild.id);
    
    // Check for existing tickets
    if (!settings.allowMultipleTickets) {
      const existingTickets = await getUserOpenTickets(interaction.guild.id, interaction.user.id);
      if (existingTickets.length > 0) {
        return interaction.reply({
          embeds: [createErrorEmbed(
            `You already have an open ticket: <#${existingTickets[0].channelId}>\n` +
            `Please close it before creating a new one.`
          )],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    // Check working hours
    const outsideHours = !isWorkingHours(settings);

    // Generate ticket ID
    const ticketId = await generateTicketId(interaction.guild.id, settings.ticketPrefix);

    // Determine category
    let parentId = null;
    if (settings.ticketCategoryId) {
      const category = await interaction.guild.channels.fetch(settings.ticketCategoryId).catch(() => null);
      if (category && category.type === ChannelType.GuildCategory) {
        parentId = category.id;
      }
    }

    // Create channel
    const channelName = `${settings.ticketPrefix}-${interaction.user.username.toLowerCase().slice(0, 10)}-${ticketId.split('-')[1]}`;
    const permissions = buildTicketPermissions(
      interaction.guild,
      interaction.user.id,
      settings.supportRoleIds,
      settings.claimRoleId
    );

    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: parentId,
      permissionOverwrites: permissions,
      topic: `Ticket ${ticketId} - ${interaction.user.tag}`
    });

    // Create ticket in database
    const ticket = await createTicket(
      interaction.guild.id,
      channel.id,
      interaction.user.id,
      ticketType,
      ticketId
    );

    // Send initial embeds
    const createdEmbed = createTicketCreatedEmbed(ticket, interaction.user, ticketType);
    await channel.send({ embeds: [createdEmbed] });

    // Send AI auto-response
    const autoResponse = getAutoResponse(ticketType);
    const autoResponseEmbed = {
      title: autoResponse.title,
      description: autoResponse.message,
      color: 0x5865f2,
      timestamp: new Date().toISOString()
    };
    await channel.send({ embeds: [autoResponseEmbed] });

    // Send working hours notice if outside hours
    if (outsideHours) {
      const hoursEmbed = createWorkingHoursEmbed();
      await channel.send({ embeds: [hoursEmbed] });
    }

    // Ping support roles once and attach action buttons to the message
    const components = buildTicketComponents(ticket, settings);
    if (settings.supportRoleIds.length > 0) {
      const mentions = settings.supportRoleIds.map(id => `<@&${id}>`).join(' ');
      await channel.send({
        content: `${mentions} - New ticket created!`,
        components: components
      });
    } else {
      // If no support roles, just send the buttons
      await channel.send({
        content: 'New ticket created!',
        components: components
      });
    }

    // Log action
    await logAction(interaction.guild.id, 'ticket_created', interaction.user.id, ticketId, {
      type: ticketType,
      channelId: channel.id
    });

    // Acknowledge interaction
    await interaction.reply({
      embeds: [createSuccessEmbed(`Ticket created! ${channel}`)],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    await interaction.reply({
      embeds: [createErrorEmbed('Failed to create ticket. Please try again later.')],
      flags: MessageFlags.Ephemeral
    });
  }
}

function buildTicketComponents(ticket, settings) {
  const row1 = new ActionRowBuilder();
  const row2 = new ActionRowBuilder();

  if (settings.enableClaimSystem && !ticket.claimedBy) {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`${COMPONENT_IDS.TICKET_CLAIM}_${ticket.ticketId}`)
        .setLabel('Claim Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✅')
    );
  }

  row1.addComponents(
    new ButtonBuilder()
      .setCustomId(`${COMPONENT_IDS.TICKET_CLOSE}_${ticket.ticketId}`)
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒')
  );

  if (ticket.status === 'open') {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`${COMPONENT_IDS.TICKET_LOCK}_${ticket.ticketId}`)
        .setLabel('Lock Ticket')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔐')
    );
  } else if (ticket.status === 'locked') {
    row1.addComponents(
      new ButtonBuilder()
        .setCustomId(`${COMPONENT_IDS.TICKET_UNLOCK}_${ticket.ticketId}`)
        .setLabel('Unlock Ticket')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔓')
    );
  }

  // Add rename button for staff
  row2.addComponents(
    new ButtonBuilder()
      .setCustomId(`${COMPONENT_IDS.TICKET_RENAME}_${ticket.ticketId}`)
      .setLabel('Rename Channel')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('✏️')
  );

  return [row1, row2];
}

export async function handleTicketClaim(interaction) {
  // Extract ticket ID (everything after "ticket_claim_")
  const prefix = `${COMPONENT_IDS.TICKET_CLAIM}_`;
  const ticketId = interaction.customId.substring(prefix.length);
  
  try {
    const ticket = await getTicketByTicketId(ticketId);
    if (!ticket) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ticket not found.')],
        flags: MessageFlags.Ephemeral
      });
    }

    if (ticket.claimedBy) {
      return interaction.reply({
        embeds: [createErrorEmbed('This ticket is already claimed.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const settings = await getOrCreateGuildSettings(interaction.guild.id);
    
    // Check permissions
    if (!canManageTickets(interaction.member, settings.supportRoleIds) && 
        (!settings.claimRoleId || !interaction.member.roles.cache.has(settings.claimRoleId))) {
      return interaction.reply({
        embeds: [createErrorEmbed('You don\'t have permission to claim tickets.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Claim ticket
    await claimTicket(ticketId, interaction.user.id);
    const updatedTicket = await getTicketByTicketId(ticketId);

    // Update embed
    const embed = createTicketClaimedEmbed(updatedTicket, interaction.user);
    await interaction.channel.send({ embeds: [embed] });

    // Update buttons
    const components = buildTicketComponents(updatedTicket, settings);
    const message = await interaction.channel.messages.fetch(interaction.message.id).catch(() => null);
    if (message) {
      await message.edit({ components });
    }

    // Log action
    await logAction(interaction.guild.id, 'ticket_claimed', interaction.user.id, ticketId);

    await interaction.reply({
      embeds: [createSuccessEmbed('Ticket claimed successfully!')],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('Error claiming ticket:', error);
    await interaction.reply({
      embeds: [createErrorEmbed('Failed to claim ticket.')],
      flags: MessageFlags.Ephemeral
    });
  }
}

export async function handleTicketClose(interaction) {
  // Extract ticket ID (everything after "ticket_close_")
  const prefix = `${COMPONENT_IDS.TICKET_CLOSE}_`;
  const ticketId = interaction.customId.substring(prefix.length);
  
  // Defer reply immediately to avoid interaction timeout
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  
  try {
    const ticket = await getTicketByTicketId(ticketId);
    if (!ticket) {
      return interaction.editReply({
        embeds: [createErrorEmbed('Ticket not found.')]
      });
    }

    const settings = await getOrCreateGuildSettings(interaction.guild.id);
    
    // Check permissions
    if (!canManageTickets(interaction.member, settings.supportRoleIds)) {
      return interaction.editReply({
        embeds: [createErrorEmbed('You don\'t have permission to close tickets.')]
      });
    }

    // Close ticket
    await closeTicket(ticketId, interaction.user.id);
    const updatedTicket = await getTicketByTicketId(ticketId);

    // Generate transcript if enabled (before deleting channel)
    let transcriptAttachment = null;
    if (settings.enableTranscripts) {
      try {
        // Fetch all messages (Discord API max is 100 per request, so we fetch in batches)
        const messages = await fetchAllMessages(interaction.channel);
        
        // Ensure we have a valid Collection with messages
        if (messages && messages.size > 0) {
          transcriptAttachment = await generateTranscript(messages, interaction.channel, updatedTicket);
        }

        // Get user who opened the ticket
        const user = await interaction.client.users.fetch(ticket.userId).catch(() => null);
        const userMention = user ? `<@${user.id}>` : 'Unknown User';

        // Send to transcript channel if set
        if (transcriptAttachment && settings.transcriptChannelId) {
          const transcriptChannel = await interaction.guild.channels.fetch(settings.transcriptChannelId).catch(() => null);
          if (transcriptChannel) {
            await transcriptChannel.send({
              content: `Transcript for ticket ${ticketId} ${userMention}`,
              files: [transcriptAttachment]
            });
          }
        }

        // Try to DM user
        if (transcriptAttachment && user) {
          try {
            await user.send({
              content: `Your ticket ${ticketId} has been closed. Here's the transcript:`,
              files: [transcriptAttachment]
            });
          } catch (dmError) {
            // User has DMs disabled, ignore
          }
        }
      } catch (transcriptError) {
        console.error('Error generating transcript:', transcriptError);
      }
    }

    // Send close embed
    const embed = createTicketClosedEmbed(updatedTicket, interaction.user);
    await interaction.channel.send({ embeds: [embed] });

    // Wait a moment for the embed to be sent
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Delete the channel
    try {
      await interaction.channel.delete('Ticket closed');
    } catch (deleteError) {
      console.error('Error deleting channel:', deleteError);
      // If deletion fails, just remove user's access as fallback
      await interaction.channel.permissionOverwrites.edit(ticket.userId, {
        ViewChannel: false
      }).catch(() => {});
    }

    // Log action
    await logAction(interaction.guild.id, 'ticket_closed', interaction.user.id, ticketId, {
      channelDeleted: true
    });

    // Try to edit reply, but if channel is deleted, the interaction might be invalid
    try {
      await interaction.editReply({
        embeds: [createSuccessEmbed('Ticket closed and channel deleted successfully!')]
      });
    } catch (editError) {
      // Channel might be deleted, interaction might be invalid - that's okay
      if (editError.code !== 10008) { // Unknown Message - expected when channel is deleted
        console.error('Error editing reply:', editError);
      }
    }
  } catch (error) {
    console.error('Error closing ticket:', error);
    try {
      await interaction.editReply({
        embeds: [createErrorEmbed('Failed to close ticket.')]
      });
    } catch (editError) {
      // Interaction might have expired or channel deleted, try followUp
      if (editError.code !== 10008) { // Unknown Message - might be expected
        try {
          await interaction.followUp({
            embeds: [createErrorEmbed('Failed to close ticket.')],
            flags: MessageFlags.Ephemeral
          });
        } catch (followUpError) {
          console.error('Failed to send error message:', followUpError);
        }
      }
    }
  }
}

export async function handleTicketReopen(interaction) {
  // Extract ticket ID (everything after "ticket_reopen_")
  const prefix = `${COMPONENT_IDS.TICKET_REOPEN}_`;
  const ticketId = interaction.customId.substring(prefix.length);
  
  try {
    const ticket = await getTicketByTicketId(ticketId);
    if (!ticket) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ticket not found.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const settings = await getOrCreateGuildSettings(interaction.guild.id);
    
    // Check permissions
    if (!canManageTickets(interaction.member, settings.supportRoleIds)) {
      return interaction.reply({
        embeds: [createErrorEmbed('You don\'t have permission to reopen tickets.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Reopen ticket
    await reopenTicket(ticketId);
    const updatedTicket = await getTicketByTicketId(ticketId);

    // Restore user's access
    await interaction.channel.permissionOverwrites.edit(ticket.userId, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });

    // Send reopen embed
    const embed = createTicketReopenedEmbed(updatedTicket, interaction.user);
    await interaction.channel.send({ embeds: [embed] });

    // Update buttons
    const components = buildTicketComponents(updatedTicket, settings);
    const message = await interaction.channel.messages.fetch(interaction.message.id).catch(() => null);
    if (message) {
      await message.edit({ components });
    }

    // Log action
    await logAction(interaction.guild.id, 'ticket_reopened', interaction.user.id, ticketId);

    await interaction.reply({
      embeds: [createSuccessEmbed('Ticket reopened successfully!')],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('Error reopening ticket:', error);
    const message = error.message || 'Failed to reopen ticket.';
    await interaction.reply({
      embeds: [createErrorEmbed(message)],
      flags: MessageFlags.Ephemeral
    });
  }
}

export async function handleTicketLock(interaction) {
  // Extract ticket ID (everything after "ticket_lock_")
  const prefix = `${COMPONENT_IDS.TICKET_LOCK}_`;
  const ticketId = interaction.customId.substring(prefix.length);
  
  try {
    const ticket = await getTicketByTicketId(ticketId);
    if (!ticket) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ticket not found.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const settings = await getOrCreateGuildSettings(interaction.guild.id);
    
    // Check permissions
    if (!canManageTickets(interaction.member, settings.supportRoleIds)) {
      return interaction.reply({
        embeds: [createErrorEmbed('You don\'t have permission to lock tickets.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Lock ticket
    await lockTicket(ticketId);
    const updatedTicket = await getTicketByTicketId(ticketId);

    // Remove user's send permission
    await interaction.channel.permissionOverwrites.edit(ticket.userId, {
      SendMessages: false
    });

    // Send lock embed
    const embed = createTicketLockedEmbed(updatedTicket, interaction.user);
    await interaction.channel.send({ embeds: [embed] });

    // Update buttons
    const components = buildTicketComponents(updatedTicket, settings);
    const message = await interaction.channel.messages.fetch(interaction.message.id).catch(() => null);
    if (message) {
      await message.edit({ components });
    }

    // Log action
    await logAction(interaction.guild.id, 'ticket_locked', interaction.user.id, ticketId);

    await interaction.reply({
      embeds: [createSuccessEmbed('Ticket locked successfully!')],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('Error locking ticket:', error);
    await interaction.reply({
      embeds: [createErrorEmbed('Failed to lock ticket.')],
      flags: MessageFlags.Ephemeral
    });
  }
}

export async function handleTicketUnlock(interaction) {
  // Extract ticket ID (everything after "ticket_unlock_")
  const prefix = `${COMPONENT_IDS.TICKET_UNLOCK}_`;
  const ticketId = interaction.customId.substring(prefix.length);
  
  try {
    const ticket = await getTicketByTicketId(ticketId);
    if (!ticket) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ticket not found.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const settings = await getOrCreateGuildSettings(interaction.guild.id);
    
    // Check permissions
    if (!canManageTickets(interaction.member, settings.supportRoleIds)) {
      return interaction.reply({
        embeds: [createErrorEmbed('You don\'t have permission to unlock tickets.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Unlock ticket
    await unlockTicket(ticketId);
    const updatedTicket = await getTicketByTicketId(ticketId);

    // Restore user's send permission
    await interaction.channel.permissionOverwrites.edit(ticket.userId, {
      SendMessages: true
    });

    // Send unlock embed
    const embed = createTicketUnlockedEmbed(updatedTicket, interaction.user);
    await interaction.channel.send({ embeds: [embed] });

    // Update buttons
    const components = buildTicketComponents(updatedTicket, settings);
    const message = await interaction.channel.messages.fetch(interaction.message.id).catch(() => null);
    if (message) {
      await message.edit({ components });
    }

    // Log action
    await logAction(interaction.guild.id, 'ticket_unlocked', interaction.user.id, ticketId);

    await interaction.reply({
      embeds: [createSuccessEmbed('Ticket unlocked successfully!')],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('Error unlocking ticket:', error);
    await interaction.reply({
      embeds: [createErrorEmbed('Failed to unlock ticket.')],
      flags: MessageFlags.Ephemeral
    });
  }
}

export async function handleTicketRename(interaction) {
  // Extract ticket ID (everything after "ticket_rename_")
  const prefix = `${COMPONENT_IDS.TICKET_RENAME}_`;
  const ticketId = interaction.customId.substring(prefix.length);
  
  try {
    const ticket = await getTicketByTicketId(ticketId);
    if (!ticket) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ticket not found.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const settings = await getOrCreateGuildSettings(interaction.guild.id);
    
    // Check permissions
    if (!canManageTickets(interaction.member, settings.supportRoleIds)) {
      return interaction.reply({
        embeds: [createErrorEmbed('You don\'t have permission to rename tickets.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Show modal for new channel name
    const modal = new ModalBuilder()
      .setCustomId(`ticket_rename_modal_${ticketId}`)
      .setTitle('Rename Ticket Channel');

    const nameInput = new TextInputBuilder()
      .setCustomId('new_channel_name')
      .setLabel('New Channel Name')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter new channel name (lowercase, no spaces)')
      .setValue(interaction.channel.name)
      .setMinLength(1)
      .setMaxLength(100)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(nameInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } catch (error) {
    console.error('Error showing rename modal:', error);
    await interaction.reply({
      embeds: [createErrorEmbed('Failed to open rename dialog.')],
      flags: MessageFlags.Ephemeral
    });
  }
}

export async function handleTicketRenameModal(interaction) {
  // Extract ticket ID from modal customId
  const ticketId = interaction.customId.split('_').pop();
  
  try {
    const ticket = await getTicketByTicketId(ticketId);
    if (!ticket) {
      return interaction.reply({
        embeds: [createErrorEmbed('Ticket not found.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const settings = await getOrCreateGuildSettings(interaction.guild.id);
    
    // Check permissions
    if (!canManageTickets(interaction.member, settings.supportRoleIds)) {
      return interaction.reply({
        embeds: [createErrorEmbed('You don\'t have permission to rename tickets.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const newName = interaction.fields.getTextInputValue('new_channel_name').trim().toLowerCase();
    
    // Validate channel name (Discord requirements: lowercase, alphanumeric and hyphens/underscores, 1-100 chars)
    if (!/^[a-z0-9_-]+$/.test(newName)) {
      return interaction.reply({
        embeds: [createErrorEmbed('Invalid channel name. Use only lowercase letters, numbers, hyphens, and underscores.')],
        flags: MessageFlags.Ephemeral
      });
    }

    if (newName.length < 1 || newName.length > 100) {
      return interaction.reply({
        embeds: [createErrorEmbed('Channel name must be between 1 and 100 characters.')],
        flags: MessageFlags.Ephemeral
      });
    }

    // Get old name before renaming
    const oldName = interaction.channel.name;

    // Rename the channel
    await interaction.channel.setName(newName, `Renamed by ${interaction.user.tag}`);

    // Send confirmation
    const embed = createSuccessEmbed(`Channel renamed from \`${oldName}\` to \`${newName}\` by ${interaction.user}`);
    await interaction.channel.send({ embeds: [embed] });

    // Log action
    await logAction(interaction.guild.id, 'ticket_renamed', interaction.user.id, ticketId, {
      oldName: oldName,
      newName: newName
    });

    await interaction.reply({
      embeds: [createSuccessEmbed(`Channel renamed to \`${newName}\` successfully!`)],
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('Error renaming ticket:', error);
    await interaction.reply({
      embeds: [createErrorEmbed(`Failed to rename channel: ${error.message || 'Unknown error'}`)],
      flags: MessageFlags.Ephemeral
    });
  }
}
