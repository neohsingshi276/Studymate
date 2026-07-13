const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        default: ''
    },
    fileUrl: {
        type: String,
        default: ''
    },
    fileName: {
        type: String,
        default: ''
    },
    fileType: {
        type: String,
        default: ''
    },
    fileSize: {
        type: Number,
        default: 0
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String,
        trim: true
    }],
    bookmarkedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },
    flagged: {
        type: Boolean,
        default: false
    },
    flagReason: {
        type: String,
        default: ''
    },
    isRemoved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);