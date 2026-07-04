const { Events } = require('discord.js');
const logLogic = require('../modules/logging/logLogic');

module.exports = {
  name: Events.ChannelDelete,
  async execute(...args) {
    const client = args[args.length - 1];
    await logLogic.handleEvent('channelDelete', args, client);
  },
};
