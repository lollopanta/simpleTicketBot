import { MessageFlags } from 'discord.js';
import { COMPONENT_IDS } from '../config/constants.js';
import { handleError } from '../utils/errors.js';

/**
 * Interaction event handler
 * Maintained via Context7 for consistency
 */

export async function execute(interaction, client) {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      
      if (!command) {
        return interaction.reply({
          content: '❌ Command not found.',
          flags: MessageFlags.Ephemeral
        });
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        await handleError(interaction, error);
      }
      return;
    }

    // Handle select menus
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;

      if (customId === COMPONENT_IDS.TICKET_SELECT) {
        const { handleTicketSelect } = await import('../components/ticket.js');
        await handleTicketSelect(interaction);
        return;
      }
    }

    // Handle buttons
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // Ticket management buttons
      if (customId.startsWith(COMPONENT_IDS.TICKET_CLAIM)) {
        const { handleTicketClaim } = await import('../components/ticket.js');
        await handleTicketClaim(interaction);
        return;
      }

      if (customId.startsWith(COMPONENT_IDS.TICKET_CLOSE)) {
        const { handleTicketClose } = await import('../components/ticket.js');
        await handleTicketClose(interaction);
        return;
      }

      if (customId.startsWith(COMPONENT_IDS.TICKET_REOPEN)) {
        const { handleTicketReopen } = await import('../components/ticket.js');
        await handleTicketReopen(interaction);
        return;
      }

      if (customId.startsWith(COMPONENT_IDS.TICKET_LOCK)) {
        const { handleTicketLock } = await import('../components/ticket.js');
        await handleTicketLock(interaction);
        return;
      }

      if (customId.startsWith(COMPONENT_IDS.TICKET_UNLOCK)) {
        const { handleTicketUnlock } = await import('../components/ticket.js');
        await handleTicketUnlock(interaction);
        return;
      }

      if (customId.startsWith(COMPONENT_IDS.TICKET_RENAME)) {
        const { handleTicketRename } = await import('../components/ticket.js');
        await handleTicketRename(interaction);
        return;
      }

      // Settings buttons
      if (customId.startsWith('settings_')) {
        const { handleSettingsInteraction } = await import('../components/settings.js');
        await handleSettingsInteraction(interaction);
        return;
      }
    }

    // Handle modals
    if (interaction.isModalSubmit()) {
      const customId = interaction.customId;

      if (customId.startsWith('settings_') && customId.endsWith('_modal')) {
        const { handleSettingsModal } = await import('../components/settings.js');
        await handleSettingsModal(interaction);
        return;
      }

      if (customId.startsWith('ticket_rename_modal_')) {
        const { handleTicketRenameModal } = await import('../components/ticket.js');
        await handleTicketRenameModal(interaction);
        return;
      }
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    await handleError(interaction, error);
  }
}
