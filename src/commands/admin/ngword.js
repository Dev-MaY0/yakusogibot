const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const prisma = require('../../database/db');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ngword')
    .setDescription('NGワードの管理を行います。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('NGワードを追加します。')
        .addStringOption(option =>
          option.setName('word').setDescription('追加するワード').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('NGワードを削除します。')
        .addStringOption(option =>
          option.setName('word').setDescription('削除するワード').setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('NGワードのリストを表示します。')
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (subcommand === 'add') {
      const word = interaction.options.getString('word');
      const existing = await prisma.nGWord.findFirst({ where: { guildId, word } });
      
      if (existing) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', 'そのワードは既に登録されています。')], ephemeral: true });
      }

      await prisma.nGWord.create({ data: { guildId, word } });
      return interaction.reply({ embeds: [createSuccessEmbed('追加成功', `NGワード「${word}」を追加しました。`)] });

    } else if (subcommand === 'remove') {
      const word = interaction.options.getString('word');
      const existing = await prisma.nGWord.findFirst({ where: { guildId, word } });
      
      if (!existing) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', 'そのワードは登録されていません。')], ephemeral: true });
      }

      await prisma.nGWord.delete({ where: { id: existing.id } });
      return interaction.reply({ embeds: [createSuccessEmbed('削除成功', `NGワード「${word}」を削除しました。`)] });

    } else if (subcommand === 'list') {
      const words = await prisma.nGWord.findMany({ where: { guildId } });
      
      if (words.length === 0) {
        return interaction.reply({ embeds: [createInfoEmbed('NGワード一覧', '登録されているNGワードはありません。')] });
      }

      const listString = words.map(w => `・${w.word}`).join('\n');
      return interaction.reply({ embeds: [createInfoEmbed('NGワード一覧', listString)] });
    }
  },
};
