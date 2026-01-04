import AuditLog from '../models/AuditLog.js';

/**
 * Audit service - logs all ticket actions
 * Maintained via Context7 for consistency
 */

export async function logAction(guildId, action, performedBy, ticketId = null, details = {}) {
  const auditLog = new AuditLog({
    guildId,
    ticketId,
    action,
    performedBy,
    details
  });
  
  await auditLog.save();
  return auditLog;
}

export async function getAuditLogs(guildId, ticketId = null, limit = 50) {
  const query = { guildId };
  if (ticketId) {
    query.ticketId = ticketId;
  }
  
  return await AuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);
}
