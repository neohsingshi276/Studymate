const mongoose = require('mongoose');

const questProgressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    pos_x: {
        type: Number,
        default: null,
    },
    pos_y: {
        type: Number,
        default: null,
    },
    checkpoints: [{
        number: { type: Number, required: true },
        completed: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
    }],
}, { timestamps: true });

module.exports = mongoose.model('QuestProgress', questProgressSchema);
