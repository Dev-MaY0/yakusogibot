const { SlashCommandBuilder } = require('discord.js');
const prisma = require('../../database/db');
const { createSuccessEmbed, createErrorEmbed, createInfoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('todo')
    .setDescription('ToDoリスト機能')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('ToDoを追加します。')
        .addStringOption(option => option.setName('content').setDescription('内容').setRequired(true))
        .addStringOption(option => 
          option.setName('priority')
            .setDescription('優先度')
            .setRequired(false)
            .addChoices(
              { name: '低', value: 'low' },
              { name: '中', value: 'normal' },
              { name: '高', value: 'high' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('ToDoリストを表示します。')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('complete')
        .setDescription('ToDoを完了にします。')
        .addIntegerOption(option => option.setName('id').setDescription('ToDo ID').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('ToDoを削除します。')
        .addIntegerOption(option => option.setName('id').setDescription('ToDo ID').setRequired(true))
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    if (subcommand === 'add') {
      const content = interaction.options.getString('content');
      const priority = interaction.options.getString('priority') || 'normal';

      await prisma.todo.create({ data: { userId, content, priority } });
      await interaction.reply({ embeds: [createSuccessEmbed('ToDo追加', 'ToDoを保存しました。')], ephemeral: true });

    } else if (subcommand === 'list') {
      const todos = await prisma.todo.findMany({ where: { userId }, orderBy: { id: 'asc' } });
      if (todos.length === 0) {
        return interaction.reply({ content: 'ToDoはありません。', ephemeral: true });
      }

      const completed = todos.filter(t => t.completed).length;
      const rate = Math.floor((completed / todos.length) * 100);

      let listStr = `**達成率:** ${rate}% (${completed}/${todos.length})\n\n`;
      for (const t of todos) {
        const check = t.completed ? '✅' : '❌';
        let pStr = '';
        if (t.priority === 'high') pStr = '🟥';
        if (t.priority === 'normal') pStr = '🟨';
        if (t.priority === 'low') pStr = '🟦';
        
        listStr += `**[${t.id}]** ${check} ${pStr} ${t.content}\n`;
      }

      await interaction.reply({ embeds: [createInfoEmbed('ToDoリスト', listStr.substring(0, 4000))], ephemeral: true });

    } else if (subcommand === 'complete') {
      const id = interaction.options.getInteger('id');
      const todo = await prisma.todo.findUnique({ where: { id } });

      if (!todo || todo.userId !== userId) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', '指定されたIDのToDoが見つかりません。')], ephemeral: true });
      }

      await prisma.todo.update({ where: { id }, data: { completed: !todo.completed } });
      await interaction.reply({ embeds: [createSuccessEmbed('ToDo更新', `ToDoを${!todo.completed ? '完了' : '未完了'}にしました。`)], ephemeral: true });

    } else if (subcommand === 'delete') {
      const id = interaction.options.getInteger('id');
      const todo = await prisma.todo.findUnique({ where: { id } });

      if (!todo || todo.userId !== userId) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', '指定されたIDのToDoが見つかりません。')], ephemeral: true });
      }

      await prisma.todo.delete({ where: { id } });
      await interaction.reply({ embeds: [createSuccessEmbed('ToDo削除', 'ToDoを削除しました。')], ephemeral: true });
    }
  }
};
