import { EmbedBuilder } from 'discord.js';
import { COLORS, TICKET_TYPE_EMOJIS, TICKET_TYPE_NAMES, TICKET_TYPES, TICKET_STATUS } from '../config/constants.js';

/**
 * Centralized embed factory
 * Maintained via Context7 for consistency
 */

export function createTicketPanelEmbed(guild) {
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return new EmbedBuilder()
    .setTitle('🎫 Ticket System')
    .setDescription(
      'Welcome to the support system! Choose the category that best describes your request.\n\n' +
      '**Available categories:**\n' +
      `• ${TICKET_TYPE_EMOJIS[TICKET_TYPES.DEVELOPER]} ${TICKET_TYPE_NAMES[TICKET_TYPES.DEVELOPER]}\n` +
      `• ${TICKET_TYPE_EMOJIS[TICKET_TYPES.GENERAL]} ${TICKET_TYPE_NAMES[TICKET_TYPES.GENERAL]}\n` +
      `• ${TICKET_TYPE_EMOJIS[TICKET_TYPES.STAFF_APPLICATION]} ${TICKET_TYPE_NAMES[TICKET_TYPES.STAFF_APPLICATION]}\n` +
      `• ${TICKET_TYPE_EMOJIS[TICKET_TYPES.OTHER]} ${TICKET_TYPE_NAMES[TICKET_TYPES.OTHER]}`
    )
    .setColor(COLORS.PRIMARY)
    .setThumbnail('attachment://logo.png')
    .setFooter({ text: `CyberHive Staff Team • ${date}` })
    .setTimestamp();
}

export function createTicketCreatedEmbed(ticket, user, type) {
  const emoji = TICKET_TYPE_EMOJIS[type] || '🎫';
  const typeName = TICKET_TYPE_NAMES[type] || 'Ticket';

  return new EmbedBuilder()
    .setTitle(`${emoji} Ticket Created`)
    .setDescription(
      `**Ticket ID:** \`${ticket.ticketId}\`\n` +
      `**Type:** ${typeName}\n` +
      `**Created by:** ${user}\n` +
      `**Status:** ${ticket.status.toUpperCase()}\n\n` +
      `Support staff will be with you shortly.`
    )
    .setColor(COLORS.SUCCESS)
    .setTimestamp();
}

export function createTicketClaimedEmbed(ticket, claimer) {
  return new EmbedBuilder()
    .setTitle('✅ Ticket Claimed')
    .setDescription(`This ticket has been claimed by ${claimer}`)
    .setColor(COLORS.INFO)
    .setTimestamp();
}

export function createTicketClosedEmbed(ticket, closer) {
  return new EmbedBuilder()
    .setTitle('🔒 Ticket Closed')
    .setDescription(`This ticket has been closed by ${closer}`)
    .setColor(COLORS.WARNING)
    .setTimestamp();
}

export function createTicketReopenedEmbed(ticket, reopener) {
  return new EmbedBuilder()
    .setTitle('🔓 Ticket Reopened')
    .setDescription(`This ticket has been reopened by ${reopener}`)
    .setColor(COLORS.SUCCESS)
    .setTimestamp();
}

export function createTicketLockedEmbed(ticket, locker) {
  return new EmbedBuilder()
    .setTitle('🔐 Ticket Locked')
    .setDescription(`This ticket has been locked by ${locker}\nOnly staff can send messages.`)
    .setColor(COLORS.WARNING)
    .setTimestamp();
}

export function createTicketUnlockedEmbed(ticket, unlocker) {
  return new EmbedBuilder()
    .setTitle('🔓 Ticket Unlocked')
    .setDescription(`This ticket has been unlocked by ${unlocker}`)
    .setColor(COLORS.SUCCESS)
    .setTimestamp();
}

export function createSettingsEmbed(settings, guild) {
  const category = settings.ticketCategoryId 
    ? `<#${settings.ticketCategoryId}>` 
    : 'Not set';
  
  const supportRoles = settings.supportRoleIds.length > 0
    ? settings.supportRoleIds.map(id => `<@&${id}>`).join(', ')
    : 'Not set';
  
  const claimRole = settings.claimRoleId 
    ? `<@&${settings.claimRoleId}>` 
    : 'Not set';
  
  const transcriptChannel = settings.transcriptChannelId
    ? `<#${settings.transcriptChannelId}>`
    : 'Not set';
  
  const autoClose = settings.autoCloseAfterHours
    ? `${settings.autoCloseAfterHours} hours`
    : 'Disabled';
  
  const workingHours = `${settings.workingHours.start}:00 - ${settings.workingHours.end}:00`;

  return new EmbedBuilder()
    .setTitle('⚙️ Ticket System Settings')
    .setDescription('Configure your ticket system using the buttons below.')
    .addFields(
      { name: '📁 Ticket Category', value: category, inline: true },
      { name: '👥 Support Roles', value: supportRoles || 'None', inline: true },
      { name: '🎯 Claim Role', value: claimRole, inline: true },
      { name: '📝 Transcript Channel', value: transcriptChannel, inline: true },
      { name: '🏷️ Ticket Prefix', value: settings.ticketPrefix, inline: true },
      { name: '⏰ Auto-Close', value: autoClose, inline: true },
      { name: '🕐 Working Hours', value: workingHours, inline: true },
      { name: '📊 Multiple Tickets', value: settings.allowMultipleTickets ? 'Enabled' : 'Disabled', inline: true },
      { name: '🎯 Claim System', value: settings.enableClaimSystem ? 'Enabled' : 'Disabled', inline: true },
      { name: '📄 Transcripts', value: settings.enableTranscripts ? 'Enabled' : 'Disabled', inline: true }
    )
    .setColor(COLORS.PRIMARY)
    .setFooter({ text: guild.name, iconURL: guild.iconURL() })
    .setTimestamp();
}

export function createStatsEmbed(stats, guild) {
  return new EmbedBuilder()
    .setTitle('📊 Ticket Statistics')
    .setDescription('Staff performance metrics')
    .addFields(
      { name: '📈 Total Tickets', value: stats.total.toString(), inline: true },
      { name: '✅ Closed Tickets', value: stats.closed.toString(), inline: true },
      { name: '⏱️ Avg Response Time', value: stats.avgResponseTime || 'N/A', inline: true },
      { name: '🎯 Claimed Tickets', value: stats.claimed.toString(), inline: true },
      { name: '🔓 Open Tickets', value: stats.open.toString(), inline: true },
      { name: '🔐 Locked Tickets', value: stats.locked.toString(), inline: true }
    )
    .setColor(COLORS.INFO)
    .setFooter({ text: guild.name, iconURL: guild.iconURL() })
    .setTimestamp();
}

export function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setTitle('❌ Error')
    .setDescription(message)
    .setColor(COLORS.ERROR)
    .setTimestamp();
}

export function createSuccessEmbed(message) {
  return new EmbedBuilder()
    .setTitle('✅ Success')
    .setDescription(message)
    .setColor(COLORS.SUCCESS)
    .setTimestamp();
}

export function createWorkingHoursEmbed() {
  return new EmbedBuilder()
    .setTitle('⏰ Outside Working Hours')
    .setDescription(
      'You have opened a ticket outside of our working hours.\n' +
      'Our team will respond as soon as possible during business hours.\n\n' +
      'Thank you for your patience!'
    )
    .setColor(COLORS.WARNING)
    .setTimestamp();
}
