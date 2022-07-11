const { Message, MessageEmbed } = require('discord.js');
const blacklist = require('../../lists/blacklist');
const { logToDatabase } = require('../dashboard/log_to_database');
const sleep = require("timers/promises").setTimeout;
const path = require('path');
/**
 * @param {Message} message 
 */
module.exports = async (message, client) => {
    /**
     * This blacklist focuses on strict blacklisting in all channels for things like discord invites, porn links and onlyfans links
     */
    if (message?.deleted) return;
    const premChan = client.channels.cache.get(process.env.PREM_CHAN);
    const reason = 'Blacklisted Link';
    const timestamp = new Date().getTime();

    const member = message?.member;

    let found = false;
    let invite = false;

    for (var i in blacklist.links) {
        if (message?.content.toLowerCase().includes(blacklist.links[i].toLowerCase())) found = true;
        if (message?.content.toLowerCase().includes('discord.gg/') || message?.content.toLowerCase().includes('discord.com/invite')) invite = true;
    }

    for (var e in blacklist.allChannels) {
        if (found && message?.channel.id === blacklist.allChannels[e]) {
            if (member?.id !== process.env.OWNER_ID && !message?.author?.bot) {
                if (invite) {
                    member?.send({
                        content: `${process.env.BOT_DENY} \`Discord invite detected. You can only post Discord invites in ${premChan.name}\``
                    }).catch(() => {
                        message?.reply({
                            content: `${process.env.BOT_DENY} \`Discord invite detected. You can only post Discord invites in ${premChan.name}\``,
                            allowedMentions: { repliedUser: true },
                            failIfNotExists: false
                        }).catch(err => {
                            console.error(`${path.basename(__filename)} There was a problem sending a message: `, err);
                        }).then(msg => {
                            setTimeout(() => { msg?.delete().catch(err => console.error(`${path.basename(__filename)} There was a problem deleting a message: `, err)) }, 5000);
                        });
                    });
                } else {
                    member?.send({
                        content: `${process.env.BOT_DENY} \`Blacklisted link detected. You have been timedout for 30 seconds to prevent spamming\``
                    }).catch(() => {
                        message?.reply({
                            content: `${process.env.BOT_DENY} \`Blacklisted link detected. You have been timedout for 30 seconds to prevent spamming\``,
                            allowedMentions: { repliedUser: true },
                            failIfNotExists: false
                        }).catch(err => {
                            console.error(`${path.basename(__filename)} There was a problem sending a message: `, err);
                        }).then(msg => {
                            setTimeout(() => { msg?.delete().catch(err => console.error(`${path.basename(__filename)} There was a problem deleting a message: `, err)) }, 5000);
                        });
                    });
                }

                setTimeout(() => { message?.delete().catch(err => console.error(`${path.basename(__filename)} There was a problem deleting a message: `, err)) }, 600);

                member?.timeout(60000, 'Blacklisted link').catch(err => console.error(`${path.basename(__filename)} There was a problem adding a timeout: `, err));

                let msgContent = message?.content || ` `;
                if (message?.content.length > 1000) msgContent = message?.content.slice(0, 1000) + '...' || ` `;

                logToDatabase(message?.author?.id, message?.author?.tag, message?.channel.name, reason, msgContent, timestamp, reason);

                await sleep(300);
            }
        }
    }
}