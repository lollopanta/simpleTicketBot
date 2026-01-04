import 'dotenv/config';
import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import mongoose from 'mongoose';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Initialize collections
client.commands = new Collection();

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const { data, execute } = await import(`file://${filePath}`);
  
  if (data && execute) {
    client.commands.set(data.name, { data, execute });
    console.log(`✅ Loaded command: ${data.name}`);
  }
}

// Load event handlers
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  const event = await import(`file://${filePath}`);
  const eventName = file.replace('.js', '');
  
  if (event.execute) {
    if (eventName === 'ready') {
      // Use clientReady to avoid deprecation warning (v15 compatibility)
      client.once('clientReady', () => event.execute(client));
    } else {
      client.on(eventName, (...args) => event.execute(...args, client));
    }
    console.log(`✅ Loaded event: ${eventName}`);
  }
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketbot', {
  // Remove deprecated options for newer mongoose versions
})
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Register slash commands
async function registerCommands() {
  try {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    const commands = [];
    for (const [name, command] of client.commands) {
      commands.push(command.data.toJSON());
    }

    console.log(`🔄 Registering ${commands.length} application (/) commands...`);

    if (process.env.GUILD_ID) {
      // Register to specific guild (faster for development)
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ Registered commands to guild ${process.env.GUILD_ID}`);
    } else {
      // Register globally (takes up to 1 hour)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Registered commands globally');
    }
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

// Login
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('🔄 Logging in...');
    // Register commands after login
    setTimeout(registerCommands, 2000);
  })
  .catch((error) => {
    console.error('❌ Login error:', error);
    process.exit(1);
  });

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});
