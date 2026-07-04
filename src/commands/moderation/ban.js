const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('ユーザーをBANします。')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option => option.setName('user').setDescription('対象ユーザー').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('理由').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || '理由なし';

    try {
      await interaction.guild.members.ban(user, { reason: `${interaction.user.tag}: ${reason}` });
      await interaction.reply({ embeds: [createSuccessEmbed('BAN成功', `${user} をBANしました。\n理由: ${reason}`)] });
    } catch (error) {
      await interaction.reply({ embeds: [createErrorEmbed('エラー', 'BANに失敗しました。権限を確認してください。')], ephemeral: true });
    }
  }
};
