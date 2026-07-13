const mongoose = require('mongoose');

const battleResultSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    correctCount: {
        type: Number,
        required: true
    },
    totalQuestions: {
        type: Number,
        required: true
    },
    won: {
        type: Boolean,
        required: true
    },
    xpEarned: {
        type: Number,
        default: 0
    },
    coinsEarned: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('BattleResult', battleResultSchema);
