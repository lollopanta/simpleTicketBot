import { v4 as uuidv4 } from 'uuid';
import Ticket from '../models/Ticket.js';

/**
 * Generate unique ticket ID
 * Uses UUID for uniqueness, maintains via Context7
 */
export async function generateTicketId(guildId, prefix) {
  // Try UUID-based first (more unique)
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    const shortId = uuidv4().split('-')[0].toUpperCase();
    const ticketId = `${prefix}-${shortId}`;
    
    const exists = await Ticket.findOne({ ticketId, guildId });
    if (!exists) {
      return ticketId;
    }
    
    attempts++;
  }
  
  // Fallback: timestamp-based
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}
