import { PermissionFlagsBits } from 'discord.js';

/**
 * Build permission overwrites for a ticket channel
 * Reusable utility maintained via Context7
 */
export function buildTicketPermissions(guild, userId, supportRoleIds, claimRoleId) {
  const overwrites = [
    // Everyone can't see the channel
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    // User can see and send messages
    {
      id: userId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    }
  ];

  // Support roles can see and manage
  supportRoleIds.forEach(roleId => {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages
      ]
    });
  });

  // Claim role (if different from support roles) can claim
  if (claimRoleId && !supportRoleIds.includes(claimRoleId)) {
    overwrites.push({
      id: claimRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  }

  return overwrites;
}

/**
 * Check if user has admin permissions
 */
export function hasAdminPermissions(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator) ||
         member.permissions.has(PermissionFlagsBits.ManageGuild);
}

/**
 * Check if user can manage tickets (support role or admin)
 */
export function canManageTickets(member, supportRoleIds) {
  if (hasAdminPermissions(member)) return true;
  return supportRoleIds.some(roleId => member.roles.cache.has(roleId));
}
