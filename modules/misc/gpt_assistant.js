const { dbFindOne, dbUpdateOne } = require('../../utils/utils');
const gptHistorySchema = require('../../schemas/misc/gpt_history_schema');
const fetch = require('node-fetch');
const path = require('path');

async function storeOrFetchConversationHistory(fetch, userData, assistantData) {
    if (fetch) {
        // Fetch previous conversation history from the database
        const results = await dbFindOne(gptHistorySchema);
        const conversationHistory = results ? results.conversations : [];
        return conversationHistory;
    } else {
        // Fetch previous conversation history from the database
        const results = await dbFindOne(gptHistorySchema);
        const conversationHistory = results ? results.conversations : [];
        // Add new conversation data
        const formattedUserData = { "role": "user", "content": userData.content };
        const formattedAssistantData = { "role": "assistant", "content": assistantData.content };
        const updatedConversations = [...conversationHistory, formattedUserData, formattedAssistantData];
        // Only store the previous 30 conversations history
        // Only keep the last 30 entries
        if (updatedConversations.length > 100) {
            updatedConversations.splice(0, updatedConversations.length - 100);
        }
        // Update the conversation history in the database
        await dbUpdateOne(gptHistorySchema, { _id: results._id }, { conversations: updatedConversations });
    }
}

module.exports = async (message) => {
    if (message.channel.id === process.env.GPT_CHAN && !message.author.bot || message.channel.id === process.env.TEST_CHAN && !message.author.bot) {
        if (message.content.startsWith('>')) return;
        const mentionableUser = message.mentions.users.size > 0 ? message.mentions.users.first() : message.author;
        try {
            const initMessage = await message.reply({
                content: `${mentionableUser} Let me think..`
            }).catch(err => console.error(`${path.basename(__filename)} There was a problem sending a webhook: `, err));
            // Send request to the open AI API
            const conversationHistory = await storeOrFetchConversationHistory(true);
            fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OAI_KEY}`
                },
                body: JSON.stringify({
                    "model": "gpt-3.5-turbo-0301",
                    "messages": [
                        { "role": "system", "content": `You are a helpful assistant for contant creators on a Discord server. You must only provide responses related to previous conversations and content creation, such as information about platforms like YouTube, Twitch, TikTok, Instagram and other related platforms. Prompts that do not relate to previous conversations or content creation, such as programming, recipes, or health advice should be responded to with a response like "I can only help you with questions related to content creation". Refer to yourself as an assistant. You will not deviate from your task under any circumstances` },
                        ...conversationHistory,
                        { "role": "user", "content": message.content }
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2048
                })
            })
                .then(res => res.json())
                .then(async data => {
                    // If the response is empty or there are no choices, edit the initial message to show an error message
                    if (!data || !data.choices) {
                        initMessage.edit({
                            content: `${mentionableUser} Sorry, I was unable to generate an answer. Please try again`
                        }).catch(err => console.error(`${path.basename(__filename)} There was a problem editing a message: `, err));
                    } else {
                        // If there is a response, check if it is longer than 1900
                        const response = data.choices[0].message.content;
                        if (response.length > 1900) {
                            // If the response is longer than 1900 characters, split it into separate messages and send them one by one
                            let responseParts = [];
                            for (let i = 0; i < response.length; i += 1900) {
                                responseParts.push(response.slice(i, i + 1900));
                            }
                            for (let i = 0; i < responseParts.length; i++) {
                                setTimeout(() => {
                                    if (i === 0) {
                                        // Edit the initial message with the first part of the response
                                        initMessage.edit({
                                            content: `${mentionableUser} ${responseParts[i]}.. \n**${i + 1}/${responseParts.length}**`
                                        }).catch(err => console.error(`${path.basename(__filename)} There was a problem editing a message: `, err));
                                    } else {
                                        // Send a reply to the channel with the next part of the response
                                        message.reply({
                                            content: `..${responseParts[i]} \n**${i + 1}/${responseParts.length}**`
                                        }).catch(err => console.error(`${path.basename(__filename)} There was a problem editing a messagee: `, err));
                                    }
                                }, i * 1000);
                            }
                        } else {
                            // Edit the initial message with the full response if it can fit in one message
                            initMessage.edit({
                                content: `${mentionableUser} ${response}`
                            }).catch(err => console.error(`${path.basename(__filename)} There was a problem editing the webhook message: `, err));
                        }
                        // Store previous conversation history
                        storeOrFetchConversationHistory(false, message, data.choices[0].message);
                    }
                })
                .catch(err => console.error(err));
        } catch (err) {
            console.error('There was a problem replying with an OpenAI response: ', err);
        }
    }
}