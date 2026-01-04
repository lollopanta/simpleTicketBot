import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { createSettingsEmbed, createSuccessEmbed, createErrorEmbed } from '../utils/embeds.js';
import { hasAdminPermissions } from '../utils/permissions.js';
import { getOrCreateGuildSettings } from '../services/ticketService.js';
import { COMPONENT_IDS } from '../config/constants.js';

/**
 * Settings panel component handler
 * Maintained via Context7 for consistency
 */

export async function handleSettingsPanel(interaction) {
  if (!hasAdminPermissions(interaction.member)) {
    return interaction.reply({
      embeds: [createErrorEmbed('You need administrator permissions to use this command.')],
      flags: MessageFlags.Ephemeral
    });
  }

  const settings = await getOrCreateGuildSettings(interaction.guild.id);
  const embed = createSettingsEmbed(settings, interaction.guild);
  const components = buildSettingsComponents(settings);

  await interaction.reply({
    embeds: [embed],
    components,
    flags: MessageFlags.Ephemeral
  });
}

function buildSettingsComponents(settings) {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(COMPONENT_IDS.SETTINGS_CATEGORY)
        .setLabel('Set Category')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(COMPONENT_IDS.SETTINGS_SUPPORT_ROLES)
        .setLabel('Support Roles')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(COMPONENT_IDS.SETTINGS_CLAIM_ROLE)
        .setLabel('Claim Role')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(COMPONENT_IDS.SETTINGS_TRANSCRIPT_CHANNEL)
        .setLabel('Transcript Channel')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(COMPONENT_IDS.SETTINGS_PREFIX)
        .setLabel('Ticket Prefix')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(COMPONENT_IDS.SETTINGS_AUTO_CLOSE)
        .setLabel('Auto-Close Timer')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(COMPONENT_IDS.SETTINGS_WORKING_HOURS)
        .setLabel('Working Hours')
        .setStyle(ButtonStyle.Secondary)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(COMPONENT_IDS.SETTINGS_TOGGLE_MULTIPLE)
        .setLabel(settings.allowMultipleTickets ? 'Disable Multiple' : 'Enable Multiple')
        .setStyle(settings.allowMultipleTickets ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(COMPONENT_IDS.SETTINGS_TOGGLE_CLAIM)
        .setLabel(settings.enableClaimSystem ? 'Disable Claim' : 'Enable Claim')
        .setStyle(settings.enableClaimSystem ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(COMPONENT_IDS.SETTINGS_TOGGLE_TRANSCRIPTS)
        .setLabel(settings.enableTranscripts ? 'Disable Transcripts' : 'Enable Transcripts')
        .setStyle(settings.enableTranscripts ? ButtonStyle.Danger : ButtonStyle.Success)
    );

  return [row1, row2, row3];
}

export async function handleSettingsInteraction(interaction) {
  if (!hasAdminPermissions(interaction.member)) {
    return interaction.reply({
      embeds: [createErrorEmbed('You need administrator permissions.')],
      flags: MessageFlags.Ephemeral
    });
  }

  const settings = await getOrCreateGuildSettings(interaction.guild.id);
  const customId = interaction.customId;

  try {
    if (customId === COMPONENT_IDS.SETTINGS_CATEGORY) {
      await handleCategorySetting(interaction, settings);
    } else if (customId === COMPONENT_IDS.SETTINGS_SUPPORT_ROLES) {
      await handleSupportRolesSetting(interaction, settings);
    } else if (customId === COMPONENT_IDS.SETTINGS_CLAIM_ROLE) {
      await handleClaimRoleSetting(interaction, settings);
    } else if (customId === COMPONENT_IDS.SETTINGS_TRANSCRIPT_CHANNEL) {
      await handleTranscriptChannelSetting(interaction, settings);
    } else if (customId === COMPONENT_IDS.SETTINGS_PREFIX) {
      await handlePrefixSetting(interaction, settings);
    } else if (customId === COMPONENT_IDS.SETTINGS_AUTO_CLOSE) {
      await handleAutoCloseSetting(interaction, settings);
    } else if (customId === COMPONENT_IDS.SETTINGS_WORKING_HOURS) {
      await handleWorkingHoursSetting(interaction, settings);
    } else if (customId === COMPONENT_IDS.SETTINGS_TOGGLE_MULTIPLE) {
      await handleToggleMultiple(interaction, settings);
    } else if (customId === COMPONENT_IDS.SETTINGS_TOGGLE_CLAIM) {
      await handleToggleClaim(interaction, settings);
    } else if (customId === COMPONENT_IDS.SETTINGS_TOGGLE_TRANSCRIPTS) {
      await handleToggleTranscripts(interaction, settings);
    } else {
      console.error(`Unknown settings button: ${customId}`);
      await interaction.reply({
        embeds: [createErrorEmbed(`Unknown button: ${customId}`)],
        flags: MessageFlags.Ephemeral
      });
    }
  } catch (error) {
    console.error('Error handling settings interaction:', error);
    await interaction.reply({
      embeds: [createErrorEmbed('An error occurred while updating settings.')],
      flags: MessageFlags.Ephemeral
    });
  }
}

async function handleCategorySetting(interaction, settings) {
  const modal = new ModalBuilder()
    .setCustomId('settings_category_modal')
    .setTitle('Set Ticket Category');

  const input = new TextInputBuilder()
    .setCustomId('category_id')
    .setLabel('Category ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter the category ID where tickets should be created')
    .setValue(settings.ticketCategoryId || '')
    .setRequired(false);

  const row = new ActionRowBuilder().addComponents(input);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function handleSupportRolesSetting(interaction, settings) {
  const modal = new ModalBuilder()
    .setCustomId('settings_support_roles_modal')
    .setTitle('Set Support Roles');

  const input = new TextInputBuilder()
    .setCustomId('role_ids')
    .setLabel('Role IDs (comma-separated)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter role IDs separated by commas')
    .setValue(settings.supportRoleIds.join(', ') || '')
    .setRequired(false);

  const row = new ActionRowBuilder().addComponents(input);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function handleClaimRoleSetting(interaction, settings) {
  const modal = new ModalBuilder()
    .setCustomId('settings_claim_role_modal')
    .setTitle('Set Claim Role');

  const input = new TextInputBuilder()
    .setCustomId('role_id')
    .setLabel('Role ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter the role ID that can claim tickets')
    .setValue(settings.claimRoleId || '')
    .setRequired(false);

  const row = new ActionRowBuilder().addComponents(input);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function handleTranscriptChannelSetting(interaction, settings) {
  const modal = new ModalBuilder()
    .setCustomId('settings_transcript_channel_modal')
    .setTitle('Set Transcript Channel');

  const input = new TextInputBuilder()
    .setCustomId('channel_id')
    .setLabel('Channel ID')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter the channel ID where transcripts should be sent')
    .setValue(settings.transcriptChannelId || '')
    .setRequired(false);

  const row = new ActionRowBuilder().addComponents(input);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function handlePrefixSetting(interaction, settings) {
  const modal = new ModalBuilder()
    .setCustomId('settings_prefix_modal')
    .setTitle('Set Ticket Prefix');

  const input = new TextInputBuilder()
    .setCustomId('prefix')
    .setLabel('Prefix')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter the ticket prefix (e.g., ticket)')
    .setValue(settings.ticketPrefix || 'ticket')
    .setMaxLength(20)
    .setRequired(true);

  const row = new ActionRowBuilder().addComponents(input);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function handleAutoCloseSetting(interaction, settings) {
  const modal = new ModalBuilder()
    .setCustomId('settings_auto_close_modal')
    .setTitle('Set Auto-Close Timer');

  const input = new TextInputBuilder()
    .setCustomId('hours')
    .setLabel('Hours (0 to disable)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter hours after which tickets auto-close (0 to disable)')
    .setValue(settings.autoCloseAfterHours?.toString() || '0')
    .setRequired(true);

  const row = new ActionRowBuilder().addComponents(input);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function handleWorkingHoursSetting(interaction, settings) {
  const modal = new ModalBuilder()
    .setCustomId('settings_working_hours_modal')
    .setTitle('Set Working Hours');

  const startInput = new TextInputBuilder()
    .setCustomId('start_hour')
    .setLabel('Start Hour (0-23)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter start hour (0-23)')
    .setValue(settings.workingHours.start.toString())
    .setRequired(true);

  const endInput = new TextInputBuilder()
    .setCustomId('end_hour')
    .setLabel('End Hour (0-23)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter end hour (0-23)')
    .setValue(settings.workingHours.end.toString())
    .setRequired(true);

  const row1 = new ActionRowBuilder().addComponents(startInput);
  const row2 = new ActionRowBuilder().addComponents(endInput);
  modal.addComponents(row1, row2);

  await interaction.showModal(modal);
}

async function handleToggleMultiple(interaction, settings) {
  settings.allowMultipleTickets = !settings.allowMultipleTickets;
  await settings.save();

  await interaction.reply({
    embeds: [createSuccessEmbed(
      `Multiple tickets ${settings.allowMultipleTickets ? 'enabled' : 'disabled'}.`
    )],
    flags: MessageFlags.Ephemeral
  });

  // Update the settings panel
  await updateSettingsPanel(interaction, settings);
}

async function handleToggleClaim(interaction, settings) {
  settings.enableClaimSystem = !settings.enableClaimSystem;
  await settings.save();

  await interaction.reply({
    embeds: [createSuccessEmbed(
      `Claim system ${settings.enableClaimSystem ? 'enabled' : 'disabled'}.`
    )],
    flags: MessageFlags.Ephemeral
  });

  await updateSettingsPanel(interaction, settings);
}

async function handleToggleTranscripts(interaction, settings) {
  settings.enableTranscripts = !settings.enableTranscripts;
  await settings.save();

  await interaction.reply({
    embeds: [createSuccessEmbed(
      `Transcripts ${settings.enableTranscripts ? 'enabled' : 'disabled'}.`
    )],
    flags: MessageFlags.Ephemeral
  });

  await updateSettingsPanel(interaction, settings);
}

async function updateSettingsPanel(interaction, settings) {
  try {
    const embed = createSettingsEmbed(settings, interaction.guild);
    const components = buildSettingsComponents(settings);
    await interaction.message.edit({ embeds: [embed], components });
  } catch (error) {
    // Ignore if message doesn't exist
  }
}

// Handle modal submissions
export async function handleSettingsModal(interaction) {
  if (!hasAdminPermissions(interaction.member)) {
    return interaction.reply({
      embeds: [createErrorEmbed('You need administrator permissions.')],
      flags: MessageFlags.Ephemeral
    });
  }

  const settings = await getOrCreateGuildSettings(interaction.guild.id);
  const customId = interaction.customId;

  try {
    if (customId === 'settings_category_modal') {
      const categoryId = interaction.fields.getTextInputValue('category_id') || null;
      settings.ticketCategoryId = categoryId;
      await settings.save();
      await interaction.reply({
        embeds: [createSuccessEmbed(`Ticket category ${categoryId ? `set to <#${categoryId}>` : 'removed'}.`)],
        flags: MessageFlags.Ephemeral
      });
    } else if (customId === 'settings_support_roles_modal') {
      const roleIdsStr = interaction.fields.getTextInputValue('role_ids') || '';
      const roleIds = roleIdsStr.split(',').map(id => id.trim()).filter(id => id);
      settings.supportRoleIds = roleIds;
      await settings.save();
      await interaction.reply({
        embeds: [createSuccessEmbed(`Support roles updated.`)],
        flags: MessageFlags.Ephemeral
      });
    } else if (customId === 'settings_claim_role_modal') {
      const roleId = interaction.fields.getTextInputValue('role_id') || null;
      settings.claimRoleId = roleId;
      await settings.save();
      await interaction.reply({
        embeds: [createSuccessEmbed(`Claim role ${roleId ? `set to <@&${roleId}>` : 'removed'}.`)],
        flags: MessageFlags.Ephemeral
      });
    } else if (customId === 'settings_transcript_channel_modal') {
      const channelId = interaction.fields.getTextInputValue('channel_id') || null;
      settings.transcriptChannelId = channelId;
      await settings.save();
      await interaction.reply({
        embeds: [createSuccessEmbed(`Transcript channel ${channelId ? `set to <#${channelId}>` : 'removed'}.`)],
        flags: MessageFlags.Ephemeral
      });
    } else if (customId === 'settings_prefix_modal') {
      const prefix = interaction.fields.getTextInputValue('prefix').trim();
      if (prefix.length < 1 || prefix.length > 20) {
        return interaction.reply({
          embeds: [createErrorEmbed('Prefix must be between 1 and 20 characters.')],
          flags: MessageFlags.Ephemeral
        });
      }
      settings.ticketPrefix = prefix;
      await settings.save();
      await interaction.reply({
        embeds: [createSuccessEmbed(`Ticket prefix set to \`${prefix}\`.`)],
        flags: MessageFlags.Ephemeral
      });
    } else if (customId === 'settings_auto_close_modal') {
      const hours = parseInt(interaction.fields.getTextInputValue('hours'));
      if (isNaN(hours) || hours < 0) {
        return interaction.reply({
          embeds: [createErrorEmbed('Invalid hours value. Must be a number >= 0.')],
          flags: MessageFlags.Ephemeral
        });
      }
      settings.autoCloseAfterHours = hours === 0 ? null : hours;
      await settings.save();
      await interaction.reply({
        embeds: [createSuccessEmbed(`Auto-close timer ${hours === 0 ? 'disabled' : `set to ${hours} hours`}.`)],
        flags: MessageFlags.Ephemeral
      });
    } else if (customId === 'settings_working_hours_modal') {
      const start = parseInt(interaction.fields.getTextInputValue('start_hour'));
      const end = parseInt(interaction.fields.getTextInputValue('end_hour'));
      
      if (isNaN(start) || isNaN(end) || start < 0 || start > 23 || end < 0 || end > 23) {
        return interaction.reply({
          embeds: [createErrorEmbed('Invalid hours. Must be between 0 and 23.')],
          flags: MessageFlags.Ephemeral
        });
      }
      
      settings.workingHours.start = start;
      settings.workingHours.end = end;
      await settings.save();
      await interaction.reply({
        embeds: [createSuccessEmbed(`Working hours set to ${start}:00 - ${end}:00.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    // Update settings panel if it exists
    await updateSettingsPanel(interaction, settings);
  } catch (error) {
    console.error('Error handling settings modal:', error);
    await interaction.reply({
      embeds: [createErrorEmbed('An error occurred while updating settings.')],
      flags: MessageFlags.Ephemeral
    });
  }
}
