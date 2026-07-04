const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const prisma = require('../../database/db');
const { createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('earthquake')
    .setDescription('地震速報の設定を行います。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('地震速報を通知するチャンネルを設定します。')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('通知チャンネル')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('min_int')
            .setDescription('通知する最小震度')
            .setRequired(false)
            .addChoices(
              { name: '震度1以上', value: '1' },
              { name: '震度3以上', value: '3' },
              { name: '震度5弱以上', value: '5-' }
            )
        )
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const minInt = interaction.options.getString('min_int') || '1';
    const guildId = interaction.guildId;

    await prisma.guildSettings.upsert({
      where: { guildId },
      update: { earthquakeChannel: channel.id, earthquakeMinInt: minInt },
      create: { guildId, earthquakeChannel: channel.id, earthquakeMinInt: minInt },
    });

    await interaction.reply({ embeds: [createSuccessEmbed('設定完了', `地震速報を ${channel} に設定しました。\n最小震度: ${minInt}`)] });
  }
};
