const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    reviewedNotes: {
        type: Boolean,
        default: false
    },
    didPracticeQuestions: {
        type: Boolean,
        default: false
    },
    sleptBefore12: {
        type: Boolean,
        default: false
    },
    didPomodoro: {
        type: Boolean,
        default: false
    },
    drankWater: {
        type: Boolean,
        default: false
    },
    exercised: {
        type: Boolean,
        default: false
    },
    studyHours: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('Habit', habitSchema);