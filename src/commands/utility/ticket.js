const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('チケットシステムを設定します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('チケット作成パネルを設置します。')
    ),
  async execute(interaction) {
    const embed = createInfoEmbed('お問い合わせ', '下のボタンを押してチケットを作成してください。');
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create')
          .setLabel('チケットを作成')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎫')
      );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'チケットパネルを設置しました。', ephemeral: true });
  },
};
