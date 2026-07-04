const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const prisma = require('../../database/db');
const { createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('ログ機能の設定を行います。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('ログを出力するチャンネルを設定します。')
        .addChannelOption(option =>
          option.setName('target')
            .setDescription('ログチャンネル')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('target');
    const guildId = interaction.guildId;

    await prisma.guildSettings.upsert({
      where: { guildId },
      update: { logChannelId: channel.id },
      create: { guildId, logChannelId: channel.id },
    });

    await interaction.reply({ embeds: [createSuccessEmbed('設定完了', `ログチャンネルを ${channel} に設定しました。`)] });
  },
};
