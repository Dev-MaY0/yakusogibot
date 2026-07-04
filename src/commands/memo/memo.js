const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../database/db');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('memo')
    .setDescription('メモ帳機能')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('メモを追加します。')
        .addStringOption(option => option.setName('content').setDescription('メモの内容').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('メモの一覧を表示します。')
        .addStringOption(option => option.setName('search').setDescription('検索キーワード').setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('メモを編集します。')
        .addIntegerOption(option => option.setName('id').setDescription('メモID').setRequired(true))
        .addStringOption(option => option.setName('content').setDescription('新しい内容').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('メモを削除します。')
        .addIntegerOption(option => option.setName('id').setDescription('メモID').setRequired(true))
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === 'add') {
      const content = interaction.options.getString('content');
      const count = await prisma.memo.count({ where: { userId } });
      
      if (count >= 100) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', 'メモの保存上限（100件）に達しています。')], ephemeral: true });
      }

      await prisma.memo.create({ data: { userId, content } });
      await interaction.reply({ embeds: [createSuccessEmbed('メモ追加', 'メモを保存しました。')], ephemeral: true });

    } else if (subcommand === 'list') {
      const search = interaction.options.getString('search');
      let memos = [];

      if (search) {
        memos = await prisma.memo.findMany({ where: { userId, content: { contains: search } } });
      } else {
        memos = await prisma.memo.findMany({ where: { userId } });
      }

      if (memos.length === 0) {
        return interaction.reply({ content: 'メモが見つかりません。', ephemeral: true });
      }

      const listStr = memos.map(m => `**[${m.id}]** ${m.content}`).join('\n');
      await interaction.reply({ embeds: [createInfoEmbed('メモ一覧', listStr.substring(0, 4000))], ephemeral: true });

    } else if (subcommand === 'edit') {
      const id = interaction.options.getInteger('id');
      const content = interaction.options.getString('content');

      const memo = await prisma.memo.findUnique({ where: { id } });
      if (!memo || memo.userId !== userId) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', '指定されたIDのメモが見つかりません。')], ephemeral: true });
      }

      await prisma.memo.update({ where: { id }, data: { content } });
      await interaction.reply({ embeds: [createSuccessEmbed('メモ編集', 'メモを更新しました。')], ephemeral: true });

    } else if (subcommand === 'delete') {
      const id = interaction.options.getInteger('id');
      const memo = await prisma.memo.findUnique({ where: { id } });

      if (!memo || memo.userId !== userId) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', '指定されたIDのメモが見つかりません。')], ephemeral: true });
      }

      await prisma.memo.delete({ where: { id } });
      await interaction.reply({ embeds: [createSuccessEmbed('メモ削除', 'メモを削除しました。')], ephemeral: true });
    }
  }
};
