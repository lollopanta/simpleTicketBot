import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  guildId: {
    type: String,
    required: true,
    index: true
  },
  channelId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['developer', 'general', 'staff-application', 'other']
  },
  claimedBy: {
    type: String,
    default: null,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'closed', 'locked'],
    default: 'open',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  closedAt: {
    type: Date,
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  }
});

// Index for efficient queries
ticketSchema.index({ guildId: 1, userId: 1, status: 1 });
ticketSchema.index({ guildId: 1, claimedBy: 1 });

export default mongoose.model('Ticket', ticketSchema);
