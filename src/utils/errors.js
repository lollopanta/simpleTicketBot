import { MessageFlags } from 'discord.js';
import { createErrorEmbed } from './embeds.js';

/**
 * Centralized error handler
 * Maintained via Context7 for consistency
 */

export class TicketError extends Error {
  constructor(message, userFacing = true) {
    super(message);
    this.name = 'TicketError';
    this.userFacing = userFacing;
  }
}

export async function handleError(interaction, error, logError = true) {
  if (logError) {
    console.error('Error:', error);
  }

  const message = error.userFacing !== false 
    ? error.message || 'An unexpected error occurred.'
    : 'An unexpected error occurred. Please try again later.';

  const embed = createErrorEmbed(message);

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  } catch (replyError) {
    console.error('Failed to send error message:', replyError);
  }
}

export function isWorkingHours(settings) {
  if (!settings.workingHours) return true;
  
  const now = new Date();
  const hour = now.getHours();
  const { start, end } = settings.workingHours;
  
  return hour >= start && hour < end;
}
