const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const prisma = require('../../database/db');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('メッセージの予約送信を管理します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('予約メッセージを作成します。')
        .addStringOption(option => option.setName('time').setDescription('送信日時 (YYYY-MM-DD HH:mm)').setRequired(true))
        .addChannelOption(option => option.setName('channel').setDescription('送信先チャンネル').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .addStringOption(option => option.setName('content').setDescription('メッセージ内容').setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('予約メッセージ一覧を表示します。')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('予約メッセージを削除します。')
        .addIntegerOption(option => option.setName('id').setDescription('メッセージID').setRequired(true))
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (subcommand === 'create') {
      const timeStr = interaction.options.getString('time');
      const channel = interaction.options.getChannel('channel');
      const content = interaction.options.getString('content');

      const sendAt = new Date(timeStr);
      if (isNaN(sendAt.getTime()) || sendAt <= new Date()) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', '無効な日時、または過去の日時です。YYYY-MM-DD HH:mm の形式で指定してください。')], ephemeral: true });
      }

      const msg = await prisma.scheduledMessage.create({
        data: { guildId, channelId: channel.id, userId: interaction.user.id, content, sendAt }
      });

      await interaction.reply({ embeds: [createSuccessEmbed('予約完了', `ID: ${msg.id}\n${channel} に ${sendAt.toLocaleString()} に送信します。\n内容: ${content}`)] });

    } else if (subcommand === 'list') {
      const msgs = await prisma.scheduledMessage.findMany({ where: { guildId, sent: false } });
      if (msgs.length === 0) return interaction.reply({ content: '予約されたメッセージはありません。', ephemeral: true });

      const listStr = msgs.map(m => `ID: ${m.id} | <#${m.channelId}> | <t:${Math.floor(m.sendAt.getTime()/1000)}:f>\n内容: ${m.content.substring(0, 50)}...`).join('\n\n');
      await interaction.reply({ embeds: [createSuccessEmbed('予約メッセージ一覧', listStr)] });

    } else if (subcommand === 'delete') {
      const id = interaction.options.getInteger('id');
      const msg = await prisma.scheduledMessage.findUnique({ where: { id } });

      if (!msg || msg.guildId !== guildId) {
        return interaction.reply({ embeds: [createErrorEmbed('エラー', '指定されたIDの予約メッセージが見つかりません。')], ephemeral: true });
      }

      await prisma.scheduledMessage.delete({ where: { id } });
      await interaction.reply({ embeds: [createSuccessEmbed('削除完了', `ID ${id} の予約メッセージを削除しました。`)] });
    }
  }
};
