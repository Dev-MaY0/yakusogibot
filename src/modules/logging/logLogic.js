const prisma = require('../../database/db');
const { createInfoEmbed } = require('../../utils/embeds');
const { AuditLogEvent } = require('discord.js');

module.exports = {
  async handleEvent(eventName, args, client) {
    let guildId = null;
    let title = '';
    let description = '';

    try {
      if (eventName === 'messageDelete') {
        const [message] = args;
        if (!message.guild || message.author?.bot) return;
        guildId = message.guild.id;
        title = '🗑️ メッセージ削除';
        description = `**送信者:** ${message.author}\n**チャンネル:** ${message.channel}\n**内容:**\n${message.content || '不明'}`;
      } else if (eventName === 'messageUpdate') {
        const [oldMessage, newMessage] = args;
        if (!oldMessage.guild || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return;
        guildId = oldMessage.guild.id;
        title = '✏️ メッセージ編集';
        description = `**送信者:** ${oldMessage.author}\n**チャンネル:** ${oldMessage.channel}\n**編集前:**\n${oldMessage.content}\n**編集後:**\n${newMessage.content}`;
      } else if (eventName === 'guildMemberAdd') {
        const [member] = args;
        guildId = member.guild.id;
        title = '📥 メンバー参加';
        description = `**ユーザー:** ${member.user.tag} (${member.id})`;
      } else if (eventName === 'guildMemberRemove') {
        const [member] = args;
        guildId = member.guild.id;
        title = '📤 メンバー退出';
        description = `**ユーザー:** ${member.user.tag} (${member.id})`;
        
        // Check kick
        const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick }).catch(() => null);
        const kickLog = fetchedLogs?.entries.first();
        if (kickLog && kickLog.target.id === member.id && kickLog.createdAt > Date.now() - 5000) {
          title = '👢 メンバーKick';
          description += `\n**実行者:** ${kickLog.executor.tag}\n**理由:** ${kickLog.reason || 'なし'}`;
        }
      } else if (eventName === 'guildBanAdd') {
        const [ban] = args;
        guildId = ban.guild.id;
        title = '🔨 メンバーBAN';
        description = `**ユーザー:** ${ban.user.tag} (${ban.user.id})\n**理由:** ${ban.reason || 'なし'}`;
      } else if (eventName === 'guildMemberUpdate') {
        const [oldMember, newMember] = args;
        guildId = newMember.guild.id;
        
        // Timeout check
        if (!oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()) {
          title = '🔇 タイムアウト';
          description = `**ユーザー:** ${newMember.user.tag}\n**解除予定:** <t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:R>`;
        }
        // Role check
        else if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
          title = '🏷️ ロール変更';
          const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id)).map(r => r.name).join(', ');
          const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id)).map(r => r.name).join(', ');
          description = `**ユーザー:** ${newMember.user.tag}\n`;
          if (added) description += `**付与:** ${added}\n`;
          if (removed) description += `**剥奪:** ${removed}`;
        } else {
          return;
        }
      } else if (eventName === 'channelCreate') {
        const [channel] = args;
        if (!channel.guild) return;
        guildId = channel.guild.id;
        title = '📁 チャンネル作成';
        description = `**名前:** ${channel.name} (${channel.id})\n**タイプ:** ${channel.type}`;
      } else if (eventName === 'channelDelete') {
        const [channel] = args;
        if (!channel.guild) return;
        guildId = channel.guild.id;
        title = '🗑️ チャンネル削除';
        description = `**名前:** ${channel.name} (${channel.id})`;
      } else if (eventName === 'voiceStateUpdate') {
        const [oldState, newState] = args;
        if (!oldState.guild) return;
        guildId = oldState.guild.id;
        const member = newState.member;
        
        if (!oldState.channelId && newState.channelId) {
          title = '🎙️ ボイス参加';
          description = `**ユーザー:** ${member.user.tag}\n**チャンネル:** ${newState.channel.name}`;
        } else if (oldState.channelId && !newState.channelId) {
          title = '🚪 ボイス退出';
          description = `**ユーザー:** ${member.user.tag}\n**チャンネル:** ${oldState.channel.name}`;
        } else if (oldState.channelId !== newState.channelId) {
          title = '↔️ ボイス移動';
          description = `**ユーザー:** ${member.user.tag}\n**移動前:** ${oldState.channel.name}\n**移動後:** ${newState.channel.name}`;
        } else {
          return;
        }
      }

      if (!guildId || !title) return;

      const settings = await prisma.guildSettings.findUnique({ where: { guildId } });
      if (!settings || !settings.logChannelId) return;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) return;

      const logChannel = guild.channels.cache.get(settings.logChannelId);
      if (!logChannel) return;

      const embed = createInfoEmbed(title, description).setTimestamp();
      await logChannel.send({ embeds: [embed] }).catch(() => {});

    } catch (error) {
      console.error(`Error in logLogic: ${error}`);
    }
  }
};
