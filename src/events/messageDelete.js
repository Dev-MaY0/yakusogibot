const { Events } = require('discord.js');
const logLogic = require('../modules/logging/logLogic');

module.exports = {
  name: Events.MessageDelete,
  async execute(...args) {
    const client = args[args.length - 1];
    await logLogic.handleEvent('messageDelete', args, client);
  },
};
