const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const prisma = require('../../database/db');
const { createInfoEmbed, createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('認証システムの設定を行います。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('認証パネルを設置します。')
        .addRoleOption(option =>
          option.setName('role').setDescription('認証時に付与するロール').setRequired(true)
        )
    ),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    const guildId = interaction.guildId;

    await prisma.guildSettings.upsert({
      where: { guildId },
      update: { verifyRoleId: role.id, verifyChannelId: interaction.channelId },
      create: { guildId, verifyRoleId: role.id, verifyChannelId: interaction.channelId },
    });

    const embed = createInfoEmbed('サーバー認証', '下のボタンを押して認証を完了してください。\n認証が完了するとロールが付与されます。');
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verify_user')
        .setLabel('認証する')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `認証パネルを設置しました。認証ロール: ${role}`, ephemeral: true });
  },
};
