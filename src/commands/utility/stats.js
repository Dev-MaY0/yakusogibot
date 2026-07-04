const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { createSuccessEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('サーバー統計の自動更新VCをセットアップします。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('統計表示用のボイスチャンネルを作成します。')
    ),
  async execute(interaction) {
    const guild = interaction.guild;
    const category = await guild.channels.create({
      name: '📊 サーバー統計',
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.Connect],
          allow: [PermissionFlagsBits.ViewChannel],
        }
      ]
    });

    const members = await guild.members.fetch();
    const botsCount = members.filter(m => m.user.bot).size;
    const onlineCount = members.filter(m => m.presence?.status === 'online' || m.presence?.status === 'dnd' || m.presence?.status === 'idle').size;

    await guild.channels.create({ name: `👥 総人数: ${guild.memberCount}`, type: ChannelType.GuildVoice, parent: category.id });
    await guild.channels.create({ name: `🤖 Bot数: ${botsCount}`, type: ChannelType.GuildVoice, parent: category.id });
    await guild.channels.create({ name: `🟢 オンライン: ${onlineCount}`, type: ChannelType.GuildVoice, parent: category.id });

    await interaction.reply({ embeds: [createSuccessEmbed('セットアップ完了', 'サーバー統計カテゴリーとVCを作成しました。5分ごとに自動更新されます。')] });
  }
};
