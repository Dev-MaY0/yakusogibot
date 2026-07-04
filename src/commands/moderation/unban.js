const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('ユーザーのBANを解除します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption(option => option.setName('userid').setDescription('対象ユーザーID').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('理由').setRequired(false)),
  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || '理由なし';

    try {
      await interaction.guild.members.unban(userId, `${interaction.user.tag}: ${reason}`);
      await interaction.reply({ embeds: [createSuccessEmbed('UNBAN成功', `<@${userId}> のBANを解除しました。\n理由: ${reason}`)] });
    } catch (error) {
      await interaction.reply({ embeds: [createErrorEmbed('エラー', '解除に失敗しました。指定したIDが間違っているか、BANされていません。')], ephemeral: true });
    }
  }
};
