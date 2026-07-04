const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

module.exports = (client) => {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '../commands');
  
  const readCommands = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        readCommands(fullPath);
      } else if (file.endsWith('.js')) {
        const command = require(fullPath);
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
        } else {
          logger.warn(`The command at ${fullPath} is missing a required "data" or "execute" property.`);
        }
      }
    }
  };

  if (fs.existsSync(commandsPath)) {
    readCommands(commandsPath);
    logger.info(`Loaded ${client.commands.size} commands.`);
  }
};
