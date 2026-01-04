/**
 * Global constants used across the application
 * Maintained via Context7 for consistency
 */

export const TICKET_TYPES = {
  DEVELOPER: 'developer',
  GENERAL: 'general',
  STAFF_APPLICATION: 'staff-application',
  OTHER: 'other'
};

export const TICKET_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  LOCKED: 'locked'
};

export const TICKET_TYPE_EMOJIS = {
  [TICKET_TYPES.DEVELOPER]: '🧑‍💻',
  [TICKET_TYPES.GENERAL]: '📩',
  [TICKET_TYPES.STAFF_APPLICATION]: '🛡️',
  [TICKET_TYPES.OTHER]: '❓'
};

export const TICKET_TYPE_NAMES = {
  [TICKET_TYPES.DEVELOPER]: 'Developer Work Request',
  [TICKET_TYPES.GENERAL]: 'General Request',
  [TICKET_TYPES.STAFF_APPLICATION]: 'Staff Application',
  [TICKET_TYPES.OTHER]: 'Other'
};

export const COLORS = {
  SUCCESS: 0x00ff00,
  ERROR: 0xff0000,
  WARNING: 0xffaa00,
  INFO: 0x0099ff,
  PRIMARY: 0x5865f2
};

export const DEFAULT_SETTINGS = {
  ticketPrefix: 'ticket',
  allowMultipleTickets: false,
  enableClaimSystem: true,
  enableTranscripts: true,
  autoCloseAfterHours: null,
  workingHours: {
    start: 9,
    end: 17
  }
};

export const COMPONENT_IDS = {
  TICKET_SELECT: 'ticket_select',
  TICKET_CLAIM: 'ticket_claim',
  TICKET_CLOSE: 'ticket_close',
  TICKET_LOCK: 'ticket_lock',
  TICKET_UNLOCK: 'ticket_unlock',
  TICKET_REOPEN: 'ticket_reopen',
  TICKET_RENAME: 'ticket_rename',
  SETTINGS_MAIN: 'settings_main',
  SETTINGS_CATEGORY: 'settings_category',
  SETTINGS_SUPPORT_ROLES: 'settings_support_roles',
  SETTINGS_CLAIM_ROLE: 'settings_claim_role',
  SETTINGS_TRANSCRIPT_CHANNEL: 'settings_transcript_channel',
  SETTINGS_PREFIX: 'settings_prefix',
  SETTINGS_AUTO_CLOSE: 'settings_auto_close',
  SETTINGS_WORKING_HOURS: 'settings_working_hours',
  SETTINGS_TOGGLE_MULTIPLE: 'settings_toggle_multiple',
  SETTINGS_TOGGLE_CLAIM: 'settings_toggle_claim',
  SETTINGS_TOGGLE_TRANSCRIPTS: 'settings_toggle_transcripts'
};

export const AUDIT_ACTIONS = {
  TICKET_CREATED: 'ticket_created',
  TICKET_CLAIMED: 'ticket_claimed',
  TICKET_CLOSED: 'ticket_closed',
  TICKET_REOPENED: 'ticket_reopened',
  TICKET_LOCKED: 'ticket_locked',
  TICKET_UNLOCKED: 'ticket_unlocked',
  TICKET_RENAMED: 'ticket_renamed',
  SETTINGS_UPDATED: 'settings_updated'
};

export const REOPEN_WINDOW_HOURS = 24;
