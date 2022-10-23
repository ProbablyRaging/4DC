const { ContextMenuInteraction, ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const path = require('path');

module.exports = {
    name: `thread`,
    description: `Mark a help and advice thread as solved or closed`,
    cooldown: 0,
    type: ApplicationCommandType.ChatInput,
    options: [{
        name: `option`,
        description: `Chose to mark the thread as solved or closed`,
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [{ name: 'Solved', value: 'solved' },
        { name: 'Close', value: 'close' }]
    }],
    /**
     * 
     * @param {ContextMenuInteraction} interaction 
     */
    async execute(interaction) {
        const { options, channel } = interaction;

        await interaction.deferReply({ ephemeral: true }).catch(err => console.error(`${path.basename(__filename)} There was a problem deferring an interaction: `, err));

        // Only allow this command to be ran in threads channels in the help and advice forum
        if (!channel.isThread()) {
            return interaction.reply({
                content: `${process.env.BOT_DENY} This is not a thread channel`,
                ephemeral: true
            }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
        }
        if (channel.parentId !== process.env.HELP_CHAN) {
            return interaction.reply({
                content: `${process.env.BOT_DENY} This command can only be used in a <#${process.env.HELP_CHAN}> thread`,
                ephemeral: true
            }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
        }

        switch (options.getString('option')) {
            case 'solved': {
                // Get the array of current channel tags and push the solved tag
                let tagsToApply = channel.appliedTags;
                tagsToApply.push('1033879593775538196');
                (await channel.setName(`[SOLVED] ${channel.name}`)).edit({ appliedTags: tagsToApply, archived: true, locked: true });
                interaction.editReply({
                    content: `${process.env.BOT_CONF} Thread has been closed and marked as solved`,
                    ephemeral: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
                break;
            }

            case 'close': {
                await channel.edit({ archived: true, locked: true });
                interaction.editReply({
                    content: `${process.env.BOT_CONF} Thread has been closed`,
                    ephemeral: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an interaction: `, err));
                break;
            }
        }
    }
}