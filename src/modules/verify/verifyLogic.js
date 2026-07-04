const prisma = require('../../database/db');

module.exports = {
  async handleButton(interaction) {
    if (interaction.customId === 'verify_user') {
      const guildId = interaction.guildId;
      const member = interaction.member;

      const settings = await prisma.guildSettings.findUnique({ where: { guildId } });
      if (!settings || !settings.verifyRoleId) {
        return interaction.reply({ content: '認証ロールが設定されていません。管理者に連絡してください。', ephemeral: true });
      }

      if (member.roles.cache.has(settings.verifyRoleId)) {
        return interaction.reply({ content: '既に認証されています。', ephemeral: true });
      }

      try {
        await member.roles.add(settings.verifyRoleId);
        return interaction.reply({ content: '認証が完了しました！', ephemeral: true });
      } catch (error) {
        console.error('Failed to add verify role:', error);
        return interaction.reply({ content: 'ロールの付与に失敗しました。Botの権限を確認してください。', ephemeral: true });
      }
    }
  }
};
