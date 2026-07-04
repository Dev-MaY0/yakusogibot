const { Events, REST, Routes } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logger.info(`Ready! Logged in as ${client.user.tag}`);

    // Register slash commands globally or to a specific guild
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    const commandsData = client.commands.map(cmd => cmd.data.toJSON());
    
    try {
      logger.info('Started refreshing application (/) commands.');
      
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commandsData },
      );
      
      logger.info('Successfully reloaded application (/) commands.');
    } catch (error) {
      logger.error('Failed to register commands:', error);
    }
  },
};
