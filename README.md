# 🎫 Simple Ticket Bot

A fully featured, configurable, enterprise-grade Discord ticket system built with Discord.js v14, MongoDB, and modern best practices.

## ✨ Features

### Core Features
- **Slash Commands** - Modern Discord.js v14 slash command system
- **Interactive Components** - Buttons, select menus, and modals for intuitive control
- **MongoDB Persistence** - All settings and tickets stored in MongoDB
- **Multiple Ticket Types** - Developer work, general requests, staff applications, and more
- **Claim System** - Staff can claim tickets for better organization
- **Transcript System** - Automatic HTML transcript generation on ticket close
- **Auto-Close** - Configurable auto-close for inactive tickets
- **Working Hours** - Auto-reply for tickets opened outside business hours

### Advanced Features
- **AI Auto-Response** - Context-aware first responses based on ticket type
- **Ticket Lock Mode** - Lock tickets without closing them
- **Reopen System** - Reopen closed tickets within 24 hours
- **Audit Logging** - Complete action logging for accountability
- **Statistics** - Staff performance metrics and ticket statistics
- **Multiple Tickets** - Optional support for multiple open tickets per user

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- MongoDB (local or Atlas)
- Discord Bot Token
- Discord Application with Bot scope

## 🚀 Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd simpleTicketBot
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
MONGODB_URI=mongodb://localhost:27017/ticketbot
GUILD_ID=your_guild_id_here  # Optional, for faster command registration
```

### 3. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to the "Bot" section and create a bot
4. Copy the bot token to `.env`
5. Copy the Application ID (Client ID) to `.env`
6. Enable the following Privileged Gateway Intents:
   - Message Content Intent (if needed)
7. Go to OAuth2 > URL Generator:
   - Select `bot` scope
   - Select permissions:
     - Manage Channels
     - View Channels
     - Send Messages
     - Embed Links
     - Attach Files
     - Read Message History
     - Manage Messages
   - Copy the generated URL and invite the bot to your server

### 4. MongoDB Setup

#### Local MongoDB
```bash
# Install MongoDB (varies by OS)
# Start MongoDB service
mongod
```

#### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 5. Run the Bot

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 📖 Commands

### `/ticket send <channel>`
**Admin Only** - Sends the ticket creation panel to the specified channel.

The panel includes:
- Professional embed with server branding
- Rules and response time notice
- Select menu with ticket types:
  - 🧑‍💻 Developer Work Request
  - 📩 General Request
  - 🛡️ Staff Application
  - ❓ Other

### `/ticket settings`
**Admin Only** - Opens an interactive settings control panel.

Configure:
- **Ticket Category** - Where tickets are created
- **Support Roles** - Roles that can manage tickets
- **Claim Role** - Role that can claim tickets
- **Transcript Channel** - Where transcripts are sent
- **Ticket Prefix** - Prefix for ticket IDs (e.g., "ticket")
- **Auto-Close Timer** - Hours before auto-closing inactive tickets
- **Working Hours** - Business hours for auto-replies
- **Multiple Tickets** - Allow users to have multiple open tickets
- **Claim System** - Enable/disable ticket claiming
- **Transcripts** - Enable/disable transcript generation

### `/ticket stats [user]`
View ticket statistics. Optionally filter by a specific user.

Shows:
- Total tickets
- Closed tickets
- Average response time
- Claimed tickets
- Open tickets
- Locked tickets

## 🎮 Ticket Flow

### Creating a Ticket
1. User selects a ticket type from the panel
2. Bot creates a private channel
3. Bot sends welcome message with ticket ID
4. AI auto-response based on ticket type
5. Support roles are pinged once

### Claiming a Ticket
- Staff with appropriate permissions can claim tickets
- Claim button is disabled after claiming
- Embed is updated with claimer information
- Action is logged in audit log

### Closing a Ticket
- Staff can close tickets via button
- Transcript is generated (if enabled)
- Transcript is sent to transcript channel
- User receives transcript via DM
- User's channel access is removed
- Reopen button appears (within 24 hours)

### Locking/Unlocking
- Staff can lock tickets without closing
- Locked tickets prevent user from sending messages
- Can be unlocked at any time
- Useful for temporary moderation

### Reopening
- Closed tickets can be reopened within 24 hours
- User's access is restored
- Ticket status returns to open

## 🔧 Configuration

All settings are managed through the `/ticket settings` command. Settings are stored per-guild in MongoDB.

### Default Settings
- Ticket Prefix: `ticket`
- Multiple Tickets: Disabled
- Claim System: Enabled
- Transcripts: Enabled
- Auto-Close: Disabled
- Working Hours: 9:00 - 17:00

## 📁 Project Structure

```
src/
├── commands/          # Slash commands
│   └── ticket.js
├── components/        # Button, select menu, modal handlers
│   ├── ticket.js
│   └── settings.js
├── events/            # Discord event handlers
│   ├── ready.js
│   └── interactionCreate.js
├── models/            # Mongoose schemas
│   ├── GuildSettings.js
│   ├── Ticket.js
│   └── AuditLog.js
├── services/          # Business logic
│   ├── ticketService.js
│   ├── transcriptService.js
│   ├── auditService.js
│   └── aiResponseService.js
├── utils/             # Shared utilities
│   ├── permissions.js
│   ├── embeds.js
│   ├── errors.js
│   └── ticketId.js
├── config/            # Configuration constants
│   └── constants.js
└── index.js           # Main entry point
```

## 🛡️ Permissions

### Bot Permissions Required
- Manage Channels
- View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Manage Messages

### User Permissions
- **Admin Commands**: Administrator or Manage Server permission
- **Ticket Management**: Support roles (configurable)
- **Claim Tickets**: Claim role or support roles (configurable)

## 🔍 Database Schema

### GuildSettings
- `guildId` - Discord guild ID
- `ticketCategoryId` - Category for ticket channels
- `supportRoleIds[]` - Roles that can manage tickets
- `claimRoleId` - Role that can claim tickets
- `transcriptChannelId` - Channel for transcripts
- `ticketPrefix` - Prefix for ticket IDs
- `allowMultipleTickets` - Boolean
- `enableClaimSystem` - Boolean
- `enableTranscripts` - Boolean
- `autoCloseAfterHours` - Number or null
- `workingHours` - { start: number, end: number }

### Ticket
- `ticketId` - Unique ticket identifier
- `guildId` - Discord guild ID
- `channelId` - Ticket channel ID
- `userId` - Ticket creator ID
- `type` - Ticket type (developer/general/staff-application/other)
- `claimedBy` - User ID who claimed (null if unclaimed)
- `status` - open/closed/locked
- `createdAt` - Timestamp
- `closedAt` - Timestamp (null if open)
- `claimedAt` - Timestamp (null if unclaimed)

### AuditLog
- `guildId` - Discord guild ID
- `ticketId` - Related ticket ID (optional)
- `action` - Action type
- `performedBy` - User ID
- `details` - Additional metadata
- `createdAt` - Timestamp

## 🐛 Troubleshooting

### Commands not appearing
- Wait up to 1 hour for global registration, or set `GUILD_ID` for instant registration
- Ensure bot has `applications.commands` scope
- Check bot is online and connected

### MongoDB connection errors
- Verify MongoDB is running (local) or connection string is correct (Atlas)
- Check network/firewall settings
- Verify credentials in connection string

### Permission errors
- Ensure bot has required permissions in server
- Check role hierarchy (bot role must be above managed roles)
- Verify channel permissions

### Tickets not creating
- Check bot has "Manage Channels" permission
- Verify ticket category exists and is valid
- Check bot role position in hierarchy

## 📝 License

BSD 3-Clause License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- All features are tested
- Documentation is updated
- Commits are descriptive

## 📞 Support

For issues, questions, or feature requests, please open an issue on the repository.

---

**Built with ❤️ using Discord.js v14 and MongoDB**
