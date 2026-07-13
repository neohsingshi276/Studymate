const mongoose = require('mongoose');

const studyPlanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subjects: [{
        name: String,
        difficulty: String
    }],
    examDate: Date,
    hoursPerDay: Number,
    plan: [{
        day: String,
        date: String,
        sessions: [{
            subject: String,
            topic: String,
            duration: String,
            priority: String,
            completed: { type: Boolean, default: false }
        }],
        tip: String
    }],
    summary: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('StudyPlan', studyPlanSchema);