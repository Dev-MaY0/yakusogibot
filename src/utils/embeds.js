const { EmbedBuilder } = require('discord.js');
const { colors } = require('../config/config');

module.exports = {
  createSuccessEmbed: (title, description) => {
    const embed = new EmbedBuilder().setColor(colors.success);
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    return embed;
  },
  createWarningEmbed: (title, description) => {
    const embed = new EmbedBuilder().setColor(colors.warning);
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    return embed;
  },
  createErrorEmbed: (title, description) => {
    const embed = new EmbedBuilder().setColor(colors.error);
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description || 'エラーが発生しました。');
    return embed;
  },
  createInfoEmbed: (title, description) => {
    const embed = new EmbedBuilder().setColor(colors.info);
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    return embed;
  }
};
