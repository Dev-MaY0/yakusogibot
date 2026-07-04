const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const prisma = require('../../database/db');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('自動ロールを設定します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('自動付与するロールを追加します。')
        .addRoleOption(option => option.setName('role').setDescription('ロール').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('自動付与するロールを削除します。')
        .addRoleOption(option => option.setName('role').setDescription('ロール').setRequired(true))
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const role = interaction.options.getRole('role');
    const guildId = interaction.guildId;

    if (role.managed) {
      return interaction.reply({ embeds: [createErrorEmbed('エラー', 'Botの統合ロールなどは指定できません。')], ephemeral: true });
    }

    if (subcommand === 'add') {
      const existing = await prisma.autoRole.findFirst({ where: { guildId, roleId: role.id } });
      if (existing) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', 'そのロールは既に設定されています。')], ephemeral: true });
      }

      await prisma.autoRole.create({ data: { guildId, roleId: role.id } });
      await interaction.reply({ embeds: [createSuccessEmbed('追加成功', `自動ロールとして ${role} を設定しました。`)] });

    } else if (subcommand === 'remove') {
      const existing = await prisma.autoRole.findFirst({ where: { guildId, roleId: role.id } });
      if (!existing) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', 'そのロールは設定されていません。')], ephemeral: true });
      }

      await prisma.autoRole.delete({ where: { id: existing.id } });
      await interaction.reply({ embeds: [createSuccessEmbed('削除成功', `自動ロールから ${role} を削除しました。`)] });
    }
  }
};
