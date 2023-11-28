const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    userId: String,
    messages: [{
        sender: String,
        text: String
    }]
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
