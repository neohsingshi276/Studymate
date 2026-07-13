const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    },
    questionText: {
        type: String,
        required: true
    },
    options: {
        type: [String],
        validate: {
            validator: (arr) => arr.length === 4,
            message: 'A question must have exactly 4 options'
        },
        required: true
    },
    correctIndex: {
        type: Number,
        required: true,
        min: 0,
        max: 3
    },
    explanation: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
