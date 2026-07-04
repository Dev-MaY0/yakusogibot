const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('ユーザーをSoftBAN（BANして即解除し、メッセージを消去）します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option => option.setName('user').setDescription('対象ユーザー').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('理由').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || '理由なし';

    try {
      await interaction.guild.members.ban(user, { deleteMessageSeconds: 604800, reason: `SoftBAN - ${interaction.user.tag}: ${reason}` });
      await interaction.guild.members.unban(user.id, 'SoftBAN 解除');
      await interaction.reply({ embeds: [createSuccessEmbed('SoftBAN成功', `${user} をSoftBANしました。\n理由: ${reason}`)] });
    } catch (error) {
      await interaction.reply({ embeds: [createErrorEmbed('エラー', 'SoftBANに失敗しました。')], ephemeral: true });
    }
  }
};
