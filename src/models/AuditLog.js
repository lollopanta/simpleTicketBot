import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true
  },
  ticketId: {
    type: String,
    default: null,
    index: true
  },
    action: {
      type: String,
      required: true,
      enum: [
        'ticket_created',
        'ticket_claimed',
        'ticket_closed',
        'ticket_reopened',
        'ticket_locked',
        'ticket_unlocked',
        'ticket_renamed',
        'settings_updated'
      ]
    },
  performedBy: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient queries
auditLogSchema.index({ guildId: 1, createdAt: -1 });
auditLogSchema.index({ ticketId: 1, createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
