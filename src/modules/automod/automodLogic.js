const prisma = require('../../database/db');
const { createWarningEmbed } = require('../../utils/embeds');
const logger = require('../../utils/logger');
const { PermissionFlagsBits } = require('discord.js');

const spamCache = new Map();

// SPAM CONFIGURATION (could be moved to DB later)
const SPAM_CONFIG = {
  MAX_MESSAGES: 5,
  TIME_WINDOW: 5000, // 5 seconds
  MAX_MENTIONS: 5,
  MAX_EMOJIS: 7,
};

module.exports = {
  async handleMessage(message, client) {
    if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

    const guildId = message.guildId;
    const content = message.content;
    const authorId = message.author.id;

    // 1. NG Word Check
    const ngWords = await prisma.nGWord.findMany({ where: { guildId } });
    for (const ng of ngWords) {
      if (content.includes(ng.word) || message.author.username.includes(ng.word)) {
        await message.delete().catch(() => {});
        const embed = createWarningEmbed('警告', `${message.author} NGワード「${ng.word}」が含まれています。`);
        await message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete().catch(()=>Object), 5000));
        
        // Log it
        this.logAction(guildId, client, 'NGワード検知', `${message.author.tag} がNGワードを使用しました。\n内容: ${content}`);
        return;
      }
    }

    // 2. Spam Check
    const now = Date.now();
    if (!spamCache.has(authorId)) {
      spamCache.set(authorId, { messages: [], duplicates: 0, lastContent: '' });
    }
    
    const userData = spamCache.get(authorId);
    userData.messages = userData.messages.filter(time => now - time < SPAM_CONFIG.TIME_WINDOW);
    userData.messages.push(now);

    // Check duplicate
    if (userData.lastContent === content) {
      userData.duplicates++;
    } else {
      userData.duplicates = 0;
      userData.lastContent = content;
    }

    // Mention check
    const mentionsCount = message.mentions.users.size + message.mentions.roles.size;
    
    // Emoji check
    const emojiRegex = /<a?:.+?:\d+>|[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;
    const emojiCount = (content.match(emojiRegex) || []).length;

    // URL Check (basic)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlCount = (content.match(urlRegex) || []).length;

    let isSpam = false;
    let reason = '';

    if (userData.messages.length > SPAM_CONFIG.MAX_MESSAGES) { isSpam = true; reason = '短時間での連続投稿'; }
    else if (userData.duplicates >= 3) { isSpam = true; reason = '同一内容の連続投稿'; }
    else if (mentionsCount > SPAM_CONFIG.MAX_MENTIONS) { isSpam = true; reason = '大量のメンション'; }
    else if (emojiCount > SPAM_CONFIG.MAX_EMOJIS) { isSpam = true; reason = '絵文字スパム'; }
    else if (urlCount > 3) { isSpam = true; reason = 'URLの連続投稿'; }

    if (isSpam) {
      await message.delete().catch(() => {});
      const embed = createWarningEmbed('警告', `${message.author} スパム行為（${reason}）を検知しました。`);
      await message.channel.send({ embeds: [embed] }).then(m => setTimeout(() => m.delete().catch(()=>Object), 5000));
      
      this.logAction(guildId, client, 'スパム検知', `${message.author.tag} がスパム行為を行いました。\n理由: ${reason}`);
      
      // Reset cache to prevent multiple triggers
      spamCache.delete(authorId);
      
      // Default punishment -> timeout for 5m
      try {
        await message.member.timeout(5 * 60 * 1000, `Automod: ${reason}`);
      } catch (e) {
        logger.error('Failed to timeout member for spam', e);
      }
    }
  },

  async logAction(guildId, client, title, description) {
    const settings = await prisma.guildSettings.findUnique({ where: { guildId } });
    if (!settings || !settings.logChannelId) return;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(settings.logChannelId);
    if (!channel) return;

    const embed = createWarningEmbed(title, description);
    await channel.send({ embeds: [embed] }).catch(() => {});
  }
};
