const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const prisma = require('../../database/db');
const { createInfoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recruit')
    .setDescription('募集を作成します。')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('募集を作成します。')
        .addStringOption(option => 
          option.setName('type')
            .setDescription('種類')
            .setRequired(true)
            .addChoices(
              { name: 'ゲーム', value: 'game' },
              { name: 'VC', value: 'vc' },
              { name: 'イベント', value: 'event' },
              { name: '自由募集', value: 'free' }
            )
        )
        .addStringOption(option => option.setName('title').setDescription('タイトル').setRequired(true))
        .addIntegerOption(option => option.setName('capacity').setDescription('募集人数').setRequired(true))
    ),
  async execute(interaction) {
    const type = interaction.options.getString('type');
    const title = interaction.options.getString('title');
    const capacity = interaction.options.getInteger('capacity');

    let typeStr = '📝 自由募集';
    if (type === 'game') typeStr = '🎮 ゲーム';
    else if (type === 'vc') typeStr = '🎙️ VC';
    else if (type === 'event') typeStr = '📅 イベント';

    const embed = createInfoEmbed(`募集: ${title}`, `**種類:** ${typeStr}\n**募集人数:** 0/${capacity}\n**主催者:** ${interaction.user}`);
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('recruit_join')
        .setLabel('参加する')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('recruit_leave')
        .setLabel('キャンセル')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('recruit_close')
        .setLabel('募集終了')
        .setStyle(ButtonStyle.Danger)
    );

    const message = await interaction.channel.send({ content: `${interaction.user} が募集を開始しました！`, embeds: [embed], components: [row] });
    
    await prisma.recruit.create({
      data: {
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        messageId: message.id,
        userId: interaction.user.id,
        type,
        title,
        capacity,
      }
    });

    await interaction.reply({ content: '募集を作成しました。', ephemeral: true });
  }
};
