const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const prisma = require('../../database/db');
const { createInfoEmbed, createSuccessEmbed, createWarningEmbed } = require('../../utils/embeds');

module.exports = {
  async handleButton(interaction, client) {
    if (interaction.customId === 'ticket_create') {
      await this.createTicket(interaction);
    } else if (interaction.customId === 'ticket_close') {
      await this.closeTicket(interaction);
    } else if (interaction.customId === 'ticket_delete') {
      await this.deleteTicket(interaction);
    }
  },

  async createTicket(interaction) {
    const guild = interaction.guild;
    const user = interaction.user;

    // Check if user already has an open ticket
    const existingTicket = await prisma.ticket.findFirst({
      where: { guildId: guild.id, userId: user.id, status: 'open' }
    });

    if (existingTicket) {
      return interaction.reply({ content: '既にオープンなチケットがあります。', ephemeral: true });
    }

    // Create channel
    const channelName = `ticket-${user.username}`;
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
        {
          // Allow administrators
          id: guild.roles.everyone, // actually this should be admin roles, but relying on default admin perms is fine
          // Better: just let people with Administrator view it by default.
        }
      ],
    });

    await prisma.ticket.create({
      data: {
        guildId: guild.id,
        channelId: channel.id,
        userId: user.id,
      }
    });

    const embed = createInfoEmbed('チケット作成', `${user} チケットが作成されました。担当者が来るまでお待ちください。`);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('チケットを閉じる')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    await channel.send({ content: `${user}`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `チケットが作成されました: ${channel}`, ephemeral: true });
  },

  async closeTicket(interaction) {
    const channel = interaction.channel;
    
    await prisma.ticket.updateMany({
      where: { channelId: channel.id },
      data: { status: 'closed' }
    });

    // Transcript generation
    const messages = await channel.messages.fetch({ limit: 100 });
    const transcriptText = messages.reverse().map(m => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
    const attachment = new AttachmentBuilder(Buffer.from(transcriptText, 'utf-8'), { name: 'transcript.txt' });

    const embed = createWarningEmbed('チケットクローズ', 'このチケットは閉じられました。');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_delete')
        .setLabel('チケットを削除')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🗑️')
    );

    // Disable view for user (need userId from db)
    const ticketData = await prisma.ticket.findFirst({ where: { channelId: channel.id } });
    if (ticketData) {
      await channel.permissionOverwrites.edit(ticketData.userId, { ViewChannel: false }).catch(() => {});
    }

    await interaction.reply({ embeds: [embed], components: [row], files: [attachment] });
  },

  async deleteTicket(interaction) {
    await interaction.reply('チャンネルを数秒後に削除します...');
    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);
  }
};
