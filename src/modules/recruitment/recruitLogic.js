const prisma = require('../../database/db');
const { createInfoEmbed } = require('../../utils/embeds');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  async handleButton(interaction) {
    const recruit = await prisma.recruit.findFirst({ where: { messageId: interaction.message.id } });
    if (!recruit) {
      return interaction.reply({ content: 'この募集は既に終了したか、データが見つかりません。', ephemeral: true });
    }

    if (recruit.status === 'closed') {
      return interaction.reply({ content: 'この募集は既に終了しています。', ephemeral: true });
    }

    if (interaction.customId === 'recruit_close') {
      if (interaction.user.id !== recruit.userId && !interaction.member.permissions.has('ManageMessages')) {
        return interaction.reply({ content: '募集を終了できるのは主催者か管理者のみです。', ephemeral: true });
      }

      await prisma.recruit.update({ where: { id: recruit.id }, data: { status: 'closed' } });
      const embed = interaction.message.embeds[0];
      const closedEmbed = createInfoEmbed(embed.title, embed.description + '\n\n**[募集終了]**').setColor('#808080');
      
      await interaction.update({ embeds: [closedEmbed], components: [] });
      return;
    }

    const members = await prisma.recruitMember.findMany({ where: { recruitId: recruit.id } });
    const isMember = members.some(m => m.userId === interaction.user.id);

    if (interaction.customId === 'recruit_join') {
      if (isMember) return interaction.reply({ content: '既に参加しています。', ephemeral: true });
      if (members.length >= recruit.capacity) return interaction.reply({ content: '既に満員です。', ephemeral: true });

      await prisma.recruitMember.create({ data: { recruitId: recruit.id, userId: interaction.user.id } });
      members.push({ userId: interaction.user.id });

    } else if (interaction.customId === 'recruit_leave') {
      if (!isMember) return interaction.reply({ content: '参加していません。', ephemeral: true });
      
      const memberRecord = members.find(m => m.userId === interaction.user.id);
      await prisma.recruitMember.delete({ where: { id: memberRecord.id } });
      const index = members.findIndex(m => m.userId === interaction.user.id);
      if (index > -1) members.splice(index, 1);
    }

    // Update embed
    const currentCount = members.length;
    let typeStr = '📝 自由募集';
    if (recruit.type === 'game') typeStr = '🎮 ゲーム';
    else if (recruit.type === 'vc') typeStr = '🎙️ VC';
    else if (recruit.type === 'event') typeStr = '📅 イベント';

    let memberList = members.map(m => `<@${m.userId}>`).join('\n') || 'なし';

    let newStatus = currentCount >= recruit.capacity ? 'full' : 'open';
    if (newStatus !== recruit.status) {
      await prisma.recruit.update({ where: { id: recruit.id }, data: { status: newStatus } });
    }

    const newEmbed = createInfoEmbed(`募集: ${recruit.title}`, `**種類:** ${typeStr}\n**募集人数:** ${currentCount}/${recruit.capacity}\n**主催者:** <@${recruit.userId}>\n\n**参加者:**\n${memberList}`);
    
    let components = interaction.message.components;
    if (newStatus === 'full') {
      newEmbed.setDescription(newEmbed.data.description + '\n\n**[満員御礼]**');
      // Disable join button
      components = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('recruit_join').setLabel('参加する').setStyle(ButtonStyle.Success).setDisabled(true),
          new ButtonBuilder().setCustomId('recruit_leave').setLabel('キャンセル').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('recruit_close').setLabel('募集終了').setStyle(ButtonStyle.Danger)
        )
      ];
    } else {
      components = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('recruit_join').setLabel('参加する').setStyle(ButtonStyle.Success).setDisabled(false),
          new ButtonBuilder().setCustomId('recruit_leave').setLabel('キャンセル').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('recruit_close').setLabel('募集終了').setStyle(ButtonStyle.Danger)
        )
      ];
    }

    await interaction.update({ embeds: [newEmbed], components });
  }
};
