const { Events } = require('discord.js');
const logLogic = require('../modules/logging/logLogic');

module.exports = {
  name: Events.ChannelCreate,
  async execute(...args) {
    const client = args[args.length - 1];
    await logLogic.handleEvent('channelCreate', args, client);
  },
};
