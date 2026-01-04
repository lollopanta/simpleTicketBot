import * as discordTranscripts from 'discord-html-transcripts';

/**
 * Transcript service - generates HTML transcripts using discord-html-transcripts
 * Maintained via Context7 for consistency
 */

/**
 * Generate transcript from messages using discord-html-transcripts
 * @param {Collection|Array} messages - Discord messages collection or array
 * @param {TextChannel} channel - The Discord channel object
 * @param {Object} ticket - Ticket data for footer customization
 * @returns {Promise<AttachmentBuilder>} Discord attachment ready to send
 */
export async function generateTranscript(messages, channel, ticket) {
  // Library accepts both Collection and Array
  // Messages should be in chronological order (oldest to newest)
  const { Collection } = await import('discord.js');
  
  let messageCollection = messages;
  
  // Ensure we have a Collection
  if (!(messages instanceof Collection)) {
    if (Array.isArray(messages)) {
      // Convert array to Collection
      messageCollection = new Collection(messages.map(msg => [msg.id, msg]));
    } else if (messages instanceof Map) {
      // Convert Map to Collection
      messageCollection = new Collection(messages);
    } else {
      throw new Error('Messages must be a Collection, Array, or Map');
    }
  }
  
  // Sort messages by timestamp (oldest first)
  const sortedMessages = Array.from(messageCollection.values())
    .filter(msg => msg && msg.id && msg.createdTimestamp) // Filter out invalid messages
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
  
  const sortedCollection = new Collection(sortedMessages.map(msg => [msg.id, msg]));

  // Ensure channel is valid
  if (!channel || !channel.id || !channel.guild) {
    throw new Error('Invalid channel provided for transcript generation');
  }

  const attachment = await discordTranscripts.generateFromMessages(
    sortedCollection,
    channel,
    {
      saveImages: true, // Save images locally in transcript
      footerText: `Ticket ${ticket.ticketId} • Closed ${ticket.closedAt ? new Date(ticket.closedAt).toLocaleString() : 'N/A'}`,
      poweredBy: false, // Remove "powered by" text
      filename: `transcript-${ticket.ticketId}-${Date.now()}.html`
    }
  );

  return attachment;
}

/**
 * Create transcript directly from channel (alternative method)
 * Automatically fetches all messages from the channel
 * @param {TextChannel} channel - The Discord channel to create transcript from
 * @param {Object} ticket - Ticket data for footer customization
 * @returns {Promise<AttachmentBuilder>} Discord attachment ready to send
 */
export async function createTranscriptFromChannel(channel, ticket) {
  const attachment = await discordTranscripts.createTranscript(
    channel,
    {
      limit: -1, // No limit, fetch all messages
      saveImages: true, // Save images locally in transcript
      footerText: `Ticket ${ticket.ticketId} • Closed ${ticket.closedAt ? new Date(ticket.closedAt).toLocaleString() : 'N/A'}`,
      poweredBy: false, // Remove "powered by" text
      filename: `transcript-${ticket.ticketId}-${Date.now()}.html`
    }
  );

  return attachment;
}

/**
 * Legacy function for backward compatibility
 * Now uses discord-html-transcripts internally
 * @deprecated Use generateTranscript or createTranscriptFromChannel directly
 */
export async function createTranscriptAttachment(html, ticketId) {
  // This function is kept for backward compatibility but is no longer used
  // The new implementation returns AttachmentBuilder directly from generateTranscript
  throw new Error('createTranscriptAttachment is deprecated. Use generateTranscript instead.');
}
