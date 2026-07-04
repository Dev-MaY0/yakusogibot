const cron = require('node-cron');
const prisma = require('../../database/db');
const logger = require('../../utils/logger');
const { createInfoEmbed } = require('../../utils/embeds');
const { ChannelType } = require('discord.js');

module.exports = (client) => {
  // Check every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // 1. Scheduled Messages
      const messages = await prisma.scheduledMessage.findMany({
        where: { sent: false, sendAt: { lte: now } }
      });

      for (const msg of messages) {
        const guild = client.guilds.cache.get(msg.guildId);
        if (guild) {
          const channel = guild.channels.cache.get(msg.channelId);
          if (channel) {
            await channel.send(msg.content).catch(() => {});
          }
        }
        await prisma.scheduledMessage.update({ where: { id: msg.id }, data: { sent: true } });
      }

      // 2. Timers
      const timers = await prisma.timer.findMany({
        where: { notified: false, endAt: { lte: now } }
      });

      for (const timer of timers) {
        const channel = client.channels.cache.get(timer.channelId);
        if (channel) {
          await channel.send(`<@${timer.userId}> タイマー（${timer.duration}秒）が終了しました！`).catch(() => {});
        }
        await prisma.timer.update({ where: { id: timer.id }, data: { notified: true } });
      }

    } catch (error) {
      logger.error('Scheduler error (1min):', error);
    }
  });

  // Check every 5 minutes for Stats Update
  cron.schedule('*/5 * * * *', async () => {
    try {
      client.guilds.cache.forEach(async (guild) => {
        // Find channels by name pattern
        const totalChannel = guild.channels.cache.find(c => c.name.startsWith('👥 総人数:'));
        const botsChannel = guild.channels.cache.find(c => c.name.startsWith('🤖 Bot数:'));
        const onlineChannel = guild.channels.cache.find(c => c.name.startsWith('🟢 オンライン:'));

        if (!totalChannel && !botsChannel && !onlineChannel) return; // Not setup

        const members = await guild.members.fetch().catch(() => null);
        if (!members) return;

        const botsCount = members.filter(m => m.user.bot).size;
        const onlineCount = members.filter(m => m.presence?.status === 'online' || m.presence?.status === 'dnd' || m.presence?.status === 'idle').size;

        if (totalChannel && totalChannel.name !== `👥 総人数: ${guild.memberCount}`) {
          await totalChannel.setName(`👥 総人数: ${guild.memberCount}`).catch(() => {});
        }
        if (botsChannel && botsChannel.name !== `🤖 Bot数: ${botsCount}`) {
          await botsChannel.setName(`🤖 Bot数: ${botsCount}`).catch(() => {});
        }
        if (onlineChannel && onlineChannel.name !== `🟢 オンライン: ${onlineCount}`) {
          await onlineChannel.setName(`🟢 オンライン: ${onlineCount}`).catch(() => {});
        }
      });
    } catch (error) {
      logger.error('Scheduler error (5min):', error);
    }
  });

  // Earthquake polling
  let lastEarthquakeId = null;
  const axios = require('axios');
  
  // Check every minute for earthquakes
  cron.schedule('* * * * *', async () => {
    try {
      const response = await axios.get('https://api.p2pquake.net/v2/history?codes=551&limit=1');
      const data = response.data[0];
      if (!data) return;

      if (lastEarthquakeId === data.id) return;
      lastEarthquakeId = data.id;

      const time = data.earthquake.time;
      const name = data.earthquake.hypocenter.name || '不明';
      const depth = data.earthquake.hypocenter.depth !== -1 ? `${data.earthquake.hypocenter.depth}km` : '不明';
      const mag = data.earthquake.hypocenter.magnitude !== -1 ? `M${data.earthquake.hypocenter.magnitude}` : '不明';
      const maxInt = data.earthquake.maxScale !== -1 ? String(data.earthquake.maxScale / 10) : '不明'; // p2pquake scale mapping is complex but we simplify
      
      const ts = data.issue.type === 'Focus' ? 'なし' : '調査中・注意';

      const embed = createInfoEmbed('地震速報', `**発生時刻:** ${time}\n**震源:** ${name}\n**深さ:** ${depth}\n**マグニチュード:** ${mag}\n**最大震度:** ${maxInt}\n**津波情報:** ${ts}`).setColor('#ff4500');

      const settingsList = await prisma.guildSettings.findMany({ where: { earthquakeChannel: { not: null } } });

      for (const settings of settingsList) {
        // Here we could filter by minInt if we map p2pquake scales correctly, keeping it simple for now
        const guild = client.guilds.cache.get(settings.guildId);
        if (guild) {
          const channel = guild.channels.cache.get(settings.earthquakeChannel);
          if (channel) {
            await channel.send({ content: '@here 地震情報', embeds: [embed] }).catch(() => {});
          }
        }
      }
    } catch (error) {
      logger.error('Earthquake polling error:', error);
    }
  });

  logger.info('Scheduler started.');
};
