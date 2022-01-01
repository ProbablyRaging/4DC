const { Message } = require('discord.js');
const mongo = require('../mongo');
const rankSchema = require('../schemas/rank-schema');
const path = require('path');
const xpLimit = new Set();
/**
 * 
 * @param {Message} message 
 */
module.exports = async (message, client, Discord) => {
    // TODO : update database with new rank per message, per 60 seconds
    //        when a new user joins we need to make a database entry for them with the 'xxxp' of 100
    //        check to see if user has changed their username and discrim each message
    //        will need to add an exception for people with no rank who use the /rank command
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const botChan = guild.channels.cache.get(process.env.TEST_CHAN);

    if (message.channel.id === process.env.TEST_CHAN) {

        if (!message.author.bot && !xpLimit.has(message?.author?.id)) {
            await mongo().then(async mongoose => {
                const results = await rankSchema.find({ id: message?.author?.id })

                // check to see if the user is in our database yet, if not, add them
                if (results.length === 0) {
                    await rankSchema.findOneAndUpdate({
                        rank: 0,
                        id: message?.author?.id,
                        username: message.author.username,
                        discrim: message.author.discriminator,
                        level: 0,
                        msgCount: 0,
                        xp: 0,
                        xxp: 0,
                        xxxp: 100
                    }, {
                        rank: 0,
                        id: message?.author?.id,
                        username: message.author.username,
                        discrim: message.author.discriminator,
                        level: 0,
                        msgCount: 0,
                        xp: 0,
                        xxp: 0,
                        xxxp: 100
                    }, {
                        upsert: true
                    })
                }

                // get a random number between 15 and 25
                function randomNum(min, max) {
                    return Math.floor(Math.random() * (max - min + 1) + min);
                }

                for (const data of results) {
                    const { xp, xxp, xxxp, level, msgCount } = data;

                    let random = randomNum(15, 25);
                    let xpMath = parseInt(xp) + random;
                    let xxpMath = parseInt(xxp) + random;
                    let msgMath = parseInt(msgCount) + 1;
                    let xxpInt = parseInt(xxp);
                    let xxxpInt = parseInt(xxxp);

                    // update user's xp and xxp per 1 message, per 60 seconds
                    await rankSchema.findOneAndUpdate({
                        id: message?.author?.id
                    }, {
                        msgCount: msgMath,
                        xp: xpMath,
                        xxp: xxpMath
                    }, {
                        upsert: true
                    })

                    // when a user ranks up, we reset their 'xxp'(level starting xp) to '0' and exponentially increase their 'xxxp'(xp needed until next rank)
                    if (xxpInt > xxxpInt) {
                        let levelMath = parseInt(level) + 1;
                        let exponential = parseInt(xxxp) + 110;

                            await rankSchema.findOneAndUpdate({
                                id: message?.author?.id
                            }, {
                                level: levelMath,
                                msgCount: msgMath,
                                xp: xpMath,
                                xxp: 0,
                                xxxp: exponential
                            }, {
                                upsert: true
                            })

                        botChan.send({
                            content: `${message?.author} just advanced to **rank ${levelMath}**`
                        })
                    }
                }
            });
        } else {
            // TODO : ad the user to xpLimit for 60 seconds to prevent spamming for xp
        }
    }
}