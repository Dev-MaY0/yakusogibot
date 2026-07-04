const { Events } = require('discord.js');
const logLogic = require('../modules/logging/logLogic');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(...args) {
    const client = args[args.length - 1];
    await logLogic.handleEvent('guildMemberAdd', args, client);

    // Auto Role
    const [member] = args;
    if (member.user.bot) return;
    
    try {
      const prisma = require('../../database/db');
      const autoRoles = await prisma.autoRole.findMany({ where: { guildId: member.guild.id } });
      for (const autoRole of autoRoles) {
        await member.roles.add(autoRole.roleId).catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }
  },
};
