/**
 * Ready event handler
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

export async function execute(client) {
  console.log(`✅ ${client.user.tag} is online!`);
  console.log(`📊 Serving ${client.guilds.cache.size} guilds`);
  
  // Start auto-close interval
  startAutoCloseInterval(client);
}

function startAutoCloseInterval(client) {
  // Check every hour for tickets to auto-close
  setInterval(async () => {
    try {
      const { getOrCreateGuildSettings, getTicketsForAutoClose, closeTicket } = await import('../services/ticketService.js');
      const { logAction } = await import('../services/auditService.js');
      const { generateTranscript } = await import('../services/transcriptService.js');
      
      // Get all guilds
      const guilds = client.guilds.cache;
      
      for (const guild of guilds.values()) {
        try {
          const settings = await getOrCreateGuildSettings(guild.id);
          
          if (!settings.autoCloseAfterHours || settings.autoCloseAfterHours <= 0) {
            continue;
          }

          const ticketsToClose = await getTicketsForAutoClose(guild.id, settings.autoCloseAfterHours);
          
          for (const ticket of ticketsToClose) {
            try {
              const channel = await guild.channels.fetch(ticket.channelId).catch(() => null);
              if (!channel) {
                // Channel doesn't exist, mark as closed
                await closeTicket(ticket.ticketId, client.user.id);
                continue;
              }

              // Close ticket
              await closeTicket(ticket.ticketId, client.user.id);
              
              // Generate transcript if enabled
              if (settings.enableTranscripts) {
                try {
                  // Fetch all messages (Discord API max is 100 per request, so we fetch in batches)
                  const messages = await fetchAllMessages(channel);
                  
                  const attachment = await generateTranscript(messages, channel, ticket);

                  // Get user mention
                  const userMention = user ? `<@${user.id}>` : 'Unknown User';

                  // Send to transcript channel if set
                  if (settings.transcriptChannelId) {
                    const transcriptChannel = await guild.channels.fetch(settings.transcriptChannelId).catch(() => null);
                    if (transcriptChannel) {
                      await transcriptChannel.send({
                        content: `Transcript for ticket ${ticket.ticketId} ${userMention}`,
                        files: [attachment]
                      });
                    }
                  }

                  // Try to DM user
                  if (user) {
                    try {
                      await user.send({
                        content: `Your ticket ${ticket.ticketId} has been automatically closed due to inactivity. Here's the transcript:`,
                        files: [attachment]
                      });
                    } catch (dmError) {
                      // User has DMs disabled, ignore
                    }
                  }
                } catch (transcriptError) {
                  console.error(`Error generating transcript for ticket ${ticket.ticketId}:`, transcriptError);
                }
              }

              // Send auto-close message
              await channel.send({
                content: `🔒 This ticket has been automatically closed due to inactivity (${settings.autoCloseAfterHours} hours).`
              });

              // Wait a moment for the message to be sent
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Delete the channel
              try {
                await channel.delete('Ticket auto-closed due to inactivity');
              } catch (deleteError) {
                console.error(`Error deleting channel for ticket ${ticket.ticketId}:`, deleteError);
                // If deletion fails, just remove user's access as fallback
                await channel.permissionOverwrites.edit(ticket.userId, {
                  ViewChannel: false
                }).catch(() => {});
              }

              // Log action
              await logAction(guild.id, 'ticket_closed', client.user.id, ticket.ticketId, {
                autoClose: true,
                hours: settings.autoCloseAfterHours,
                channelDeleted: true
              });
            } catch (ticketError) {
              console.error(`Error auto-closing ticket ${ticket.ticketId}:`, ticketError);
            }
          }
        } catch (guildError) {
          console.error(`Error processing auto-close for guild ${guild.id}:`, guildError);
        }
      }
    } catch (error) {
      console.error('Error in auto-close interval:', error);
    }
  }, 60 * 60 * 1000); // Check every hour

  console.log('🔄 Auto-close system started');
}
