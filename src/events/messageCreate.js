const { Events } = require('discord.js');
const automod = require('../modules/automod/automodLogic');

module.exports = {
  name: Events.MessageCreate,
  async execute(message, client) {
    if (message.author.bot) return;
    if (!message.guild) return;

    await automod.handleMessage(message, client);
  },
};
