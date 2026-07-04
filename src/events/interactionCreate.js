const { Events } = require('discord.js');
const logger = require('../utils/logger');
const { createErrorEmbed } = require('../utils/embeds');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(`Error executing ${interaction.commandName}`, error);
        const embed = createErrorEmbed('エラー', 'エラーが発生しました。');
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [embed], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [embed], ephemeral: true });
        }
      }
    } else if (interaction.isButton()) {
      try {
        if (interaction.customId.startsWith('ticket_')) {
          const ticketLogic = require('../modules/ticket/ticketLogic');
          await ticketLogic.handleButton(interaction, client);
        } else if (interaction.customId === 'verify_user') {
          const verifyLogic = require('../modules/verify/verifyLogic');
          await verifyLogic.handleButton(interaction);
        } else if (interaction.customId.startsWith('recruit_')) {
          const recruitLogic = require('../modules/recruitment/recruitLogic');
          await recruitLogic.handleButton(interaction);
        }
      } catch (error) {
        logger.error(`Error handling button ${interaction.customId}`, error);
      }
    } else if (interaction.isModalSubmit()) {
      // TODO: Delegate to module handlers
    } else if (interaction.isStringSelectMenu()) {
      // TODO: Delegate to module handlers
    }
  },
};
