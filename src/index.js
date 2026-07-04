require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const logger = require('./utils/logger');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember],
});

commandHandler(client);
eventHandler(client);

// Initialize Scheduler
require('./modules/scheduler/scheduler')(client);

// Error Handling to prevent crash
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', reason.stack || reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception thrown:', err);
});

// Railway Web Server Binding
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is running.'));
app.listen(port, () => logger.info(`Web server listening on port ${port}`));

client.login(process.env.DISCORD_TOKEN).catch(err => {
  logger.error('Failed to login:', err);
});
