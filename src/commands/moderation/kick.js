const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('ユーザーをKickします。')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(option => option.setName('user').setDescription('対象ユーザー').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('理由').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || '理由なし';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [createErrorEmbed('エラー', 'ユーザーが見つかりません。')], ephemeral: true });

    try {
      await member.kick(`${interaction.user.tag}: ${reason}`);
      await interaction.reply({ embeds: [createSuccessEmbed('Kick成功', `${user} をKickしました。\n理由: ${reason}`)] });
    } catch (error) {
      await interaction.reply({ embeds: [createErrorEmbed('エラー', 'Kickに失敗しました。')], ephemeral: true });
    }
  }
};
