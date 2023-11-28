const express = require('express');
const axios = require('axios');
const router = express.Router();
const Conversation = require('../models/Conversation'); 
const UserState = require('../models/UserState'); 


const hints = [
    "It starts with an E...",
    "It has seven letters...",
    "It's a name often associated with leadership...",
    "It ends with 'gan'...",
    "Does 'Erdogan' ring any bells?",
    "A leader's name, strong like the blizzards of the south...",
    "Echoing through the icy corridors, it begins with a mighty 'E'...",
    "Known across the frozen lands, it's a name of power and respect...",
    "Engraved in the annals of the penguin empire, the name is legendary...",
    "Whispered by the shivering masses, it's a name that commands obedience..."

];


const checkForNameDiscovery = async (message, userState) => {
    const lowercasedMessage = message.toLowerCase();

    if (lowercasedMessage.includes('what is your name') || 
        lowercasedMessage.includes('tell me your name') || 
        lowercasedMessage.includes('who are you')) {
        userState.nameDiscovered = true;
        userState.penguinName = 'Erdogan';
        await userState.save();  
        return "My name is Erdogan.";
    } else if (lowercasedMessage.includes('hint')) {
        if (typeof userState.hintIndex !== 'number') {
            userState.hintIndex = 0;
        }

        const hint = hints[userState.hintIndex];
        userState.hintIndex = (userState.hintIndex + 1) % hints.length;
        await userState.save();  
        return `Perhaps this will aid your guess: ${hint}`;
    }

    await userState.save();
    return null;
};




router.post('/', async (req, res) => {
    const { userId, message } = req.body;

    try {
        let userState = await UserState.findOne({ userId });

        if (!userState) {
            userState = new UserState({ userId, hintIndex: 0, nameDiscovered: false, penguinName: '' });
        }    

        let botResponse = await checkForNameDiscovery(message, userState); 

        if (botResponse === null) {
            let modifiedInput = message;
            const response = await axios.post('https://api-inference.huggingface.co/models/gpt2-xl', 
                { inputs: modifiedInput, parameters: { max_length: 50 } },
                { headers: { 'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}` } }
            );
            botResponse = response.data[0].generated_text;
        }

        await Conversation.findOneAndUpdate(
            { userId },
            { $push: { messages: [{ sender: 'user', text: message }, { sender: 'bot', text: botResponse }] } },
            { upsert: true, new: true }
        );

        res.json({ message: botResponse, nameDiscovered: userState.nameDiscovered, penguinName: userState.penguinName });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error processing message' });
    }
});



router.post('/updateNameDiscovery', async (req, res) => {
    const { userId } = req.body;

    try {
        let userState = await UserState.findOne({ userId });
        if (userState) {
            userState.nameDiscovered = true;
            userState.penguinName = 'Erdogan';
            await userState.save();
            res.json({ message: "Name discovery updated" });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error updating name discovery' });
    }
});


router.get('/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const conversation = await Conversation.findOne({ userId });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error fetching conversation history' });
    }
});

module.exports = router;
