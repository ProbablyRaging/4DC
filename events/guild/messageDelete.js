const { EmbedBuilder, AuditLogEvent, codeBlock } = require('discord.js');
const { dbUpdateOne } = require('../../utils/utils');
const { checkDeletedCountingMessage } = require('../../modules/games/counting_game');
const { checkDeletedLetterMessage } = require('../../modules/games/last_letter');
const timerSchema = require('../../schemas/misc/timer_schema');
const { ImgurClient } = require('imgur');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

function get64bin(int) {
    if (int >= 0) {
        return int.toString(2).padStart(64, "0");
    } else {
        return (-int - 1).toString(2).replace(/[01]/g, d => +!+d).padStart(64, "1");
    }
}

module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        if (message?.author.bot || message?.channel.id === process.env.TEST_CHAN) return;

        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const logChan = guild.channels.cache.get(process.env.MSGLOG_CHAN);

        setTimeout(async () => {
            // Fetch auditlogs for MessageDelete events
            const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MessageDelete });
            const entry = fetchedLogs.entries.first();
            const binary = get64bin(parseInt(entry.id)).slice(0, 42);
            const decimalEpoch = parseInt(binary, 2) + 1420070400000;
            const timestamp = Date.parse(new Date(decimalEpoch));

            // Log to channel
            let content = message?.content || ` `;
            if (message?.content.length > 1000) content = message?.content.slice(0, 1000) + '...' || ` `;

            const log = new EmbedBuilder()
                .setAuthor({ name: `${message?.author.tag}`, iconURL: message?.author.displayAvatarURL({ dynamic: true }) })
                .setColor("#E04F5F")
                .addFields({ name: `Author`, value: `${message?.author}`, inline: true },
                    { name: `Channel`, value: `${message?.channel}`, inline: true },
                    { name: `Message`, value: codeBlock(content), inline: false })
                .setFooter({ text: `Delete • ${uuidv4()}`, iconURL: process.env.LOG_DELETE })
                .setTimestamp()

            if ((new Date() - timestamp) < 10000) {
                const executor = await guild.members.fetch(entry.executor.id).catch(() => { });
                log.setAuthor({ name: `${executor?.user.tag}`, iconURL: executor?.user.displayAvatarURL({ dynamic: true }) })
            }

            let msgAttachment = message?.attachments.size > 0 ? message?.attachments.first().url : null;

            if (msgAttachment) {
                // Create a new imgur client
                const imgur = new ImgurClient({ clientId: process.env.IMGUR_ID, clientSecret: process.env.IMGUR_SECRET });

                // Upload attachment to imgur, get the link and attach it to the embed
                const response = await imgur.upload({
                    image: msgAttachment,
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem uploading an image to imgur: `, err));

                if (response.length > 0) {
                    if (response[0].status !== 200) return;
                    log.setImage(response[0].data.link);
                }
            }

            logChan.send({
                embeds: [log]
            }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending an embed: `, err));
        }, 2000);

        // If a user deletes there post in the spotlight channel before the timer is up, open the channel to be reposted in
        if (message?.channel.id === process.env.SPOTLIGHT_CHAN && !message?.author.bot) {
            const guild = client.guilds.cache.get(process.env.GUILD_ID);
            const spotlightChannel = guild.channels.cache.get(process.env.SPOTLIGHT_CHAN);
            const spotlightRole = guild.roles.cache.get(process.env.SPOTLIGHT_ROLE);

            (await spotlightChannel.messages.fetch()).forEach(message => {
                if (!message.author.bot) message.delete().catch(err => console.error(`${path.basename(__filename)} There was a problem deleting a message: `, err));
            });

            message?.member?.roles.remove(spotlightRole).catch(err => console.error(`${path.basename(__filename)} There was a problem removing a role: `, err));

            spotlightChannel.permissionOverwrites.edit(guild.id, {
                SendMessages: true,
            }).catch(err => console.error(`${path.basename(__filename)} There was a problem editing a channel's permissions: `, err));

            await dbUpdateOne(timerSchema, { timer: 'spotlight' }, { timestamp: 'null' });
        }

        // Delete a thread channel if the starter message is deleted and there are no other messages in the channel
        if (message?.channel.isThread()) {
            const starterMessage = await message?.channel.fetchStarterMessage().catch(() => { });
            if (!starterMessage && message?.channel.messageCount === 0)
                message?.channel.delete().catch(err => console.error(`${path.basename(__filename)} There was a problem deleting a thread channel: `, err));
        }

        // Game message delete checks
        checkDeletedCountingMessage(message);
        checkDeletedLetterMessage(message);
    }
}