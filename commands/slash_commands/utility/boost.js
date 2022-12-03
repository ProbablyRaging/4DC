const { CommandInteraction, ApplicationCommandType } = require('discord.js');
const path = require('path');

module.exports = {
    name: `boost`,
    description: `Provides information about the current server booster perks`,
    cooldown: 5,
    type: ApplicationCommandType.ChatInput,
    /**
     * @param {CommandInteraction} interaction 
     */
    execute(interaction) {
        const img = './res/images/booster_rewards.png';
        interaction.reply({
            files: [img],
            ephemeral: true
        }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
    }
}