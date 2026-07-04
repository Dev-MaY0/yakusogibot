const { Events } = require('discord.js');
const logLogic = require('../modules/logging/logLogic');

module.exports = {
  name: Events.MessageUpdate,
  async execute(...args) {
    const client = args[args.length - 1];
    await logLogic.handleEvent('messageUpdate', args, client);
  },
};
