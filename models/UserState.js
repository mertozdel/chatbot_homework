const mongoose = require('mongoose');

const userStateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        unique: true
    },
    nameDiscovered: {
        type: Boolean,
        default: false
    },
    penguinName: {
        type: String,
        default: ''
    },
    hintIndex: {
        type: Number,
        default: 0 
    }

});

module.exports = mongoose.model('UserState', userStateSchema);
