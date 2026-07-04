const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../database/db');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timer')
    .setDescription('タイマーをセットします。')
    .addStringOption(option => 
      option.setName('time')
        .setDescription('時間 (例: 30s, 5m, 1h)')
        .setRequired(true)
    ),
  async execute(interaction) {
    const timeStr = interaction.options.getString('time');
    let seconds = 0;

    const match = timeStr.match(/^(\d+)(s|m|h)$/);
    if (!match) {
      return interaction.reply({ embeds: [createErrorEmbed('エラー', '形式が正しくありません。例: 30s, 5m, 1h')], ephemeral: true });
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    if (unit === 's') seconds = value;
    else if (unit === 'm') seconds = value * 60;
    else if (unit === 'h') seconds = value * 3600;

    const endAt = new Date(Date.now() + seconds * 1000);

    const timer = await prisma.timer.create({
      data: { userId: interaction.user.id, channelId: interaction.channelId, duration: seconds, endAt }
    });

    await interaction.reply({ embeds: [createSuccessEmbed('タイマーセット', `ID: ${timer.id}\n${timeStr} 後（<t:${Math.floor(endAt.getTime()/1000)}:R>）にお知らせします。`)] });
  }
};
