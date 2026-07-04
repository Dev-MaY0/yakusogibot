const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const prisma = require('../../database/db');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('ユーザーに警告を与えます。')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('警告を追加します。')
        .addUserOption(option => option.setName('user').setDescription('対象ユーザー').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('理由').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('警告を削除します。')
        .addIntegerOption(option => option.setName('id').setDescription('警告ID').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('ユーザーの警告リストを表示します。')
        .addUserOption(option => option.setName('user').setDescription('対象ユーザー').setRequired(true))
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (subcommand === 'add') {
      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');

      await prisma.warn.create({
        data: { guildId, userId: targetUser.id, moderator: interaction.user.id, reason }
      });

      // Check auto-punish
      const warns = await prisma.warn.count({ where: { guildId, userId: targetUser.id } });
      const settings = await prisma.guildSettings.findUnique({ where: { guildId } });
      let autoAction = '';

      if (settings && warns >= settings.warnLimit) {
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (member) {
          if (settings.warnPunishment === 'timeout') {
            await member.timeout(24 * 60 * 60 * 1000, '警告上限到達').catch(() => {});
            autoAction = '\n上限に達したため、タイムアウト（24時間）を実行しました。';
          } else if (settings.warnPunishment === 'kick') {
            await member.kick('警告上限到達').catch(() => {});
            autoAction = '\n上限に達したため、Kickを実行しました。';
          } else if (settings.warnPunishment === 'ban') {
            await member.ban({ reason: '警告上限到達' }).catch(() => {});
            autoAction = '\n上限に達したため、Banを実行しました。';
          }
        }
      }

      await interaction.reply({ embeds: [createSuccessEmbed('警告追加', `${targetUser} に警告を追加しました。\n理由: ${reason}${autoAction}`)] });

    } else if (subcommand === 'remove') {
      const id = interaction.options.getInteger('id');
      const warn = await prisma.warn.findUnique({ where: { id } });

      if (!warn || warn.guildId !== guildId) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', '指定されたIDの警告が見つかりません。')], ephemeral: true });
      }

      await prisma.warn.delete({ where: { id } });
      await interaction.reply({ embeds: [createSuccessEmbed('警告削除', `ID ${id} の警告を削除しました。`)] });

    } else if (subcommand === 'list') {
      const targetUser = interaction.options.getUser('user');
      const warns = await prisma.warn.findMany({ where: { guildId, userId: targetUser.id } });

      if (warns.length === 0) {
        return interaction.reply({ content: 'このユーザーに警告はありません。', ephemeral: true });
      }

      const listString = warns.map(w => `ID: ${w.id} | モデレーター: <@${w.moderator}>\n理由: ${w.reason} (${w.createdAt.toLocaleString()})`).join('\n\n');
      await interaction.reply({ embeds: [createSuccessEmbed(`${targetUser.username} の警告リスト`, listString)] });
    }
  }
};
