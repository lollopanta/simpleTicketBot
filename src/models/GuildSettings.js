import mongoose from 'mongoose';

const guildSettingsSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ticketCategoryId: {
    type: String,
    default: null
  },
  supportRoleIds: {
    type: [String],
    default: []
  },
  claimRoleId: {
    type: String,
    default: null
  },
  transcriptChannelId: {
    type: String,
    default: null
  },
  ticketPrefix: {
    type: String,
    default: 'ticket'
  },
  allowMultipleTickets: {
    type: Boolean,
    default: false
  },
  enableClaimSystem: {
    type: Boolean,
    default: true
  },
  enableTranscripts: {
    type: Boolean,
    default: true
  },
  autoCloseAfterHours: {
    type: Number,
    default: null
  },
  workingHours: {
    start: {
      type: Number,
      default: 9,
      min: 0,
      max: 23
    },
    end: {
      type: Number,
      default: 17,
      min: 0,
      max: 23
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
guildSettingsSchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

export default mongoose.model('GuildSettings', guildSettingsSchema);
