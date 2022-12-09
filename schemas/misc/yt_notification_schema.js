const mongoose = require('mongoose');

const ytNotificationSchema = mongoose.Schema({

    userId: {
        type: String,
        required: true
    },
    channelId: {
        type: String,
        required: true
    },
    videoIds: {
        type: Array,
        required: true
    },
    timestamp: {
        type: Date,
        required: false
    }

});

module.exports = mongoose.model('ytnotifications', ytNotificationSchema)