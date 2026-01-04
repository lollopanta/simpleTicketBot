import { SlashCommandBuilder, PermissionFlagsBits, StringSelectMenuBuilder, ActionRowBuilder, ChannelType, AttachmentBuilder, MessageFlags } from 'discord.js';
import { createTicketPanelEmbed } from '../utils/embeds.js';
import { hasAdminPermissions } from '../utils/permissions.js';
import { COMPONENT_IDS, TICKET_TYPES, TICKET_TYPE_EMOJIS, TICKET_TYPE_NAMES } from '../config/constants.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Ticket system management commands')
  .addSubcommand(subcommand =>
    subcommand
      .setName('send')
      .setDescription('Send the ticket creation panel to a channel')
      .addChannelOption(option =>
        option
          .setName('channel')
          .setDescription('The channel to send the panel to')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('settings')
      .setDescription('Open the ticket system settings panel')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('stats')
      .setDescription('View ticket statistics')
      .addUserOption(option =>
        option
          .setName('user')
          .setDescription('View stats for a specific user (optional)')
          .setRequired(false)
      )
  );

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  // Check admin permissions for send and settings
  if (subcommand === 'send' || subcommand === 'settings') {
    if (!hasAdminPermissions(interaction.member)) {
      return interaction.reply({
        content: '❌ You need administrator permissions to use this command.',
        flags: MessageFlags.Ephemeral
      });
    }
  }

  if (subcommand === 'send') {
    await handleSend(interaction);
  } else if (subcommand === 'settings') {
    await handleSettings(interaction);
  } else if (subcommand === 'stats') {
    await handleStats(interaction);
  }
}

async function handleSend(interaction) {
  const channel = interaction.options.getChannel('channel');

  if (!channel) {
    return interaction.reply({
      content: '❌ Invalid channel specified.',
      flags: MessageFlags.Ephemeral
    });
  }

  // Check bot permissions
  const botMember = await channel.guild.members.fetch(interaction.client.user.id);
  if (!channel.permissionsFor(botMember).has([
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.EmbedLinks
  ])) {
    return interaction.reply({
      content: '❌ I don\'t have permission to send messages in that channel.',
      flags: MessageFlags.Ephemeral
    });
  }

  const embed = createTicketPanelEmbed(channel.guild);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(COMPONENT_IDS.TICKET_SELECT)
    .setPlaceholder('Select a ticket type...')
    .addOptions([
      {
        label: TICKET_TYPE_NAMES[TICKET_TYPES.DEVELOPER],
        value: TICKET_TYPES.DEVELOPER,
        emoji: TICKET_TYPE_EMOJIS[TICKET_TYPES.DEVELOPER],
        description: 'Request development work or technical assistance'
      },
      {
        label: TICKET_TYPE_NAMES[TICKET_TYPES.GENERAL],
        value: TICKET_TYPES.GENERAL,
        emoji: TICKET_TYPE_EMOJIS[TICKET_TYPES.GENERAL],
        description: 'General inquiries and support'
      },
      {
        label: TICKET_TYPE_NAMES[TICKET_TYPES.STAFF_APPLICATION],
        value: TICKET_TYPES.STAFF_APPLICATION,
        emoji: TICKET_TYPE_EMOJIS[TICKET_TYPES.STAFF_APPLICATION],
        description: 'Apply to join our staff team'
      },
      {
        label: TICKET_TYPE_NAMES[TICKET_TYPES.OTHER],
        value: TICKET_TYPES.OTHER,
        emoji: TICKET_TYPE_EMOJIS[TICKET_TYPES.OTHER],
        description: 'Other inquiries'
      }
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  // Load and attach logo
  let logoAttachment = null;
  try {
    const logoPath = join(__dirname, '../../public/logo.png');
    const logoBuffer = await readFile(logoPath);
    logoAttachment = new AttachmentBuilder(logoBuffer, { name: 'logo.png' });
  } catch (error) {
    console.warn('Could not load logo.png, sending embed without image:', error.message);
  }

  try {
    const messageOptions = { embeds: [embed], components: [row] };
    if (logoAttachment) {
      messageOptions.files = [logoAttachment];
    }
    await channel.send(messageOptions);
    await interaction.reply({
      content: `✅ Ticket panel sent to ${channel}!`,
      flags: MessageFlags.Ephemeral
    });
  } catch (error) {
    console.error('Error sending ticket panel:', error);
    await interaction.reply({
      content: '❌ Failed to send ticket panel. Please check my permissions.',
      flags: MessageFlags.Ephemeral
    });
  }
}

async function handleSettings(interaction) {
  // Settings panel is handled by components
  // Import and use the settings component handler
  const { handleSettingsPanel } = await import('../components/settings.js');
  await handleSettingsPanel(interaction);
}

async function handleStats(interaction) {
  const { getTicketStats } = await import('../services/ticketService.js');
  const { createStatsEmbed } = await import('../utils/embeds.js');
  
  const targetUser = interaction.options.getUser('user');
  const userId = targetUser ? targetUser.id : null;
  
  try {
    const stats = await getTicketStats(interaction.guild.id, userId);
    const embed = createStatsEmbed(stats, interaction.guild);
    
    const title = userId 
      ? `📊 Ticket Statistics for ${targetUser.tag}`
      : '📊 Ticket Statistics';
    
    embed.setTitle(title);
    
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error fetching stats:', error);
    await interaction.reply({
      content: '❌ Failed to fetch statistics.',
      flags: MessageFlags.Ephemeral
    });
  }
}
