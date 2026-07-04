const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('ユーザーのタイムアウトを解除します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option => option.setName('user').setDescription('対象ユーザー').setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return interaction.reply({ embeds: [createErrorEmbed('エラー', 'ユーザーが見つかりません。')], ephemeral: true });

    try {
      await member.timeout(null, `${interaction.user.tag}: タイムアウト解除`);
      await interaction.reply({ embeds: [createSuccessEmbed('解除成功', `${user} のタイムアウトを解除しました。`)] });
    } catch (error) {
      await interaction.reply({ embeds: [createErrorEmbed('エラー', '解除に失敗しました。')], ephemeral: true });
    }
  }
};
