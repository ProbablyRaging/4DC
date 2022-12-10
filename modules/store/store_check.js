const tokensSchema = require('../../schemas/misc/tokens_schema');
const path = require('path');

module.exports = async (client) => {
    setInterval(async () => {
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        const tokenLog = guild.channels.cache.get(process.env.CREDITLOG_CHAN);
        const contentShare = guild.channels.cache.get(process.env.CONTENT_SHARE);
        const giveawayChan = guild.channels.cache.get(process.env.GIVEAWAY_CHAN);

        // Find expired timestamps and null them
        const results = await tokensSchema.find();
        for (const data of results) {
            const { userId, doublexp, youtubeauto, twitchauto, livenow, linkembeds, giveaways } = data;
            const member = await guild.members.fetch(userId).catch(async () => {
                // If user doesn't excist, delete their db entry
                await tokensSchema.deleteOne({ userId: userId }).catch(err => console.error(`${path.basename(__filename)} There was a problem deleting a database entry: `, err));
            });
            if (doublexp !== true && doublexp !== null && (doublexp - new Date()) <= 0) {
                await tokensSchema.updateOne({
                    userId: userId
                }, {
                    doublexp: null
                }, {
                    upset: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem updating a database entry: `, err));
                // Log when a user's item expires
                tokenLog.send({
                    content: `${process.env.TOKENS_EXPIRE} ${member} your Double XP item expired. Buy it again now in the <#1049791650060324954> if you want to keep using it`
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending a message: `, err));
            }

            if (youtubeauto !== true && youtubeauto !== null && (youtubeauto - new Date()) <= 0) {
                await tokensSchema.updateOne({
                    userId: userId
                }, {
                    youtubeauto: null
                }, {
                    upset: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem updating a database entry: `, err));
                // Log when a user's item expires
                tokenLog.send({
                    content: `${process.env.TOKENS_EXPIRE} ${member} your YouTube Auto item expired. Buy it again now in the <#1049791650060324954> if you want to keep using it`
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending a message: `, err));
            }

            if (twitchauto !== true && twitchauto !== null && (twitchauto - new Date()) <= 0) {
                await tokensSchema.updateOne({
                    userId: userId
                }, {
                    twitchauto: null
                }, {
                    upset: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem updating a database entry: `, err));
                // Log when a user's item expires
                tokenLog.send({
                    content: `${process.env.TOKENS_EXPIRE} ${member} your Twitch Auto item expired. Buy it again now in the <#1049791650060324954> if you want to keep using it`
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending a message: `, err));
            }

            if (livenow !== true && livenow !== null && (livenow - new Date()) <= 0) {
                await tokensSchema.updateOne({
                    userId: userId
                }, {
                    livenow: null
                }, {
                    upset: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem updating a database entry: `, err));
                // Log when a user's item expires
                tokenLog.send({
                    content: `${process.env.TOKENS_EXPIRE} ${member} your Live Now Role item expired. Buy it again now in the <#1049791650060324954> if you want to keep using it`
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending a message: `, err));
            }

            if (linkembeds !== true && linkembeds !== null && (linkembeds - new Date()) <= 0) {
                await tokensSchema.updateOne({
                    userId: userId
                }, {
                    linkembeds: null
                }, {
                    upset: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem updating a database entry: `, err));
                // Remove user's link embeds permission
                contentShare.permissionOverwrites.delete(member.id).catch(err => { return console.error(`${path.basename(__filename)} There was a problem editing a channel's permissions: `, err) });
                // Log when a user's item expires
                tokenLog.send({
                    content: `${process.env.TOKENS_EXPIRE} ${member} your Link Embeds item expired. Buy it again now in the <#1049791650060324954> if you want to keep using it`
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending a message: `, err));
            }

            if (giveaways !== true && giveaways !== null && (giveaways - new Date()) <= 0) {
                await tokensSchema.updateOne({
                    userId: userId
                }, {
                    giveaways: null
                }, {
                    upset: true
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem updating a database entry: `, err));
                // Remove user's access to giveaway channel
                giveawayChan.permissionOverwrites.delete(member.id).catch(err => { return console.error(`${path.basename(__filename)} There was a problem editing a channel's permissions: `, err) });
                // Log when a user's item expires
                tokenLog.send({
                    content: `${process.env.TOKENS_EXPIRE} ${member} your Giveaway Channel item expired. Buy it again now in the <#1049791650060324954> if you want to keep using it`
                }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending a message: `, err));
            }
        }
    }, 7200000);
}