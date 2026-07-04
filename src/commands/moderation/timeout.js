const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('ユーザーをタイムアウトします。')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option => option.setName('user').setDescription('対象ユーザー').setRequired(true))
    .addStringOption(option => 
      option.setName('duration')
        .setDescription('期間 (例: 5m, 1h, 1d)')
        .setRequired(true)
        .addChoices(
          { name: '5分', value: '5m' },
          { name: '10分', value: '10m' },
          { name: '1時間', value: '1h' },
          { name: '1日', value: '1d' }
        )
    )
    .addStringOption(option => option.setName('reason').setDescription('理由').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || '理由なし';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [createErrorEmbed('エラー', 'ユーザーが見つかりません。')], ephemeral: true });

    let ms = 0;
    if (duration === '5m') ms = 5 * 60 * 1000;
    else if (duration === '10m') ms = 10 * 60 * 1000;
    else if (duration === '1h') ms = 60 * 60 * 1000;
    else if (duration === '1d') ms = 24 * 60 * 60 * 1000;

    try {
      await member.timeout(ms, `${interaction.user.tag}: ${reason}`);
      await interaction.reply({ embeds: [createSuccessEmbed('タイムアウト成功', `${user} をタイムアウトしました。\n期間: ${duration}\n理由: ${reason}`)] });
    } catch (error) {
      await interaction.reply({ embeds: [createErrorEmbed('エラー', 'タイムアウトに失敗しました。')], ephemeral: true });
    }
  }
};
