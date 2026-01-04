import Ticket from '../models/Ticket.js';
import GuildSettings from '../models/GuildSettings.js';
import { generateTicketId } from '../utils/ticketId.js';
import { TICKET_STATUS } from '../config/constants.js';

/**
 * Ticket service - handles all ticket operations
 * Maintained via Context7 for consistency
 */

export async function getOrCreateGuildSettings(guildId) {
  let settings = await GuildSettings.findOne({ guildId });
  
  if (!settings) {
    settings = new GuildSettings({ guildId });
    await settings.save();
  }
  
  return settings;
}

export async function getTicketByChannelId(channelId) {
  return await Ticket.findOne({ channelId });
}

export async function getTicketByTicketId(ticketId) {
  return await Ticket.findOne({ ticketId });
}

export async function getUserOpenTickets(guildId, userId) {
  return await Ticket.find({
    guildId,
    userId,
    status: { $in: [TICKET_STATUS.OPEN, TICKET_STATUS.LOCKED] }
  });
}

export async function createTicket(guildId, channelId, userId, type, ticketId) {
  const ticket = new Ticket({
    ticketId,
    guildId,
    channelId,
    userId,
    type,
    status: TICKET_STATUS.OPEN
  });
  
  await ticket.save();
  return ticket;
}

export async function claimTicket(ticketId, claimedBy) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) throw new Error('Ticket not found');
  
  ticket.claimedBy = claimedBy;
  ticket.claimedAt = new Date();
  await ticket.save();
  
  return ticket;
}

export async function closeTicket(ticketId, closedBy) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) throw new Error('Ticket not found');
  
  ticket.status = TICKET_STATUS.CLOSED;
  ticket.closedAt = new Date();
  await ticket.save();
  
  return ticket;
}

export async function reopenTicket(ticketId) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) throw new Error('Ticket not found');
  
  // Check if within reopen window (24 hours)
  if (ticket.closedAt) {
    const hoursSinceClose = (Date.now() - ticket.closedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceClose > 24) {
      throw new Error('Ticket cannot be reopened after 24 hours');
    }
  }
  
  ticket.status = TICKET_STATUS.OPEN;
  ticket.closedAt = null;
  await ticket.save();
  
  return ticket;
}

export async function lockTicket(ticketId) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) throw new Error('Ticket not found');
  
  ticket.status = TICKET_STATUS.LOCKED;
  await ticket.save();
  
  return ticket;
}

export async function unlockTicket(ticketId) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket) throw new Error('Ticket not found');
  
  ticket.status = TICKET_STATUS.OPEN;
  await ticket.save();
  
  return ticket;
}

export async function getTicketStats(guildId, userId = null) {
  const query = { guildId };
  if (userId) {
    query.claimedBy = userId;
  }
  
  const tickets = await Ticket.find(query);
  
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === TICKET_STATUS.OPEN).length,
    closed: tickets.filter(t => t.status === TICKET_STATUS.CLOSED).length,
    locked: tickets.filter(t => t.status === TICKET_STATUS.LOCKED).length,
    claimed: tickets.filter(t => t.claimedBy !== null).length
  };
  
  // Calculate average response time (time from creation to claim)
  const claimedTickets = tickets.filter(t => t.claimedBy && t.claimedAt && t.createdAt);
  if (claimedTickets.length > 0) {
    const totalResponseTime = claimedTickets.reduce((sum, ticket) => {
      return sum + (ticket.claimedAt.getTime() - ticket.createdAt.getTime());
    }, 0);
    const avgMs = totalResponseTime / claimedTickets.length;
    const avgMinutes = Math.round(avgMs / (1000 * 60));
    
    if (avgMinutes < 60) {
      stats.avgResponseTime = `${avgMinutes} minutes`;
    } else {
      const hours = Math.floor(avgMinutes / 60);
      const minutes = avgMinutes % 60;
      stats.avgResponseTime = `${hours}h ${minutes}m`;
    }
  } else {
    stats.avgResponseTime = 'N/A';
  }
  
  return stats;
}

export async function getTicketsForAutoClose(guildId, hours) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await Ticket.find({
    guildId,
    status: { $in: [TICKET_STATUS.OPEN, TICKET_STATUS.LOCKED] },
    createdAt: { $lt: cutoffTime }
  });
}
