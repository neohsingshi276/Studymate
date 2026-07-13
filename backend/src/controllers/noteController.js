const Note = require('../models/Note');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// POST /api/notes  (multipart/form-data — 'file' field is optional)
exports.createNote = async (req, res) => {
    try {
        const { title, subject, content, tags } = req.body;
        if (!title || !subject) {
            return res.status(400).json({ message: 'Title and subject are required' });
        }
        if (!content && !req.file) {
            return res.status(400).json({ message: 'Add note content or attach a file' });
        }

        const note = await Note.create({
            author: req.user.id,
            title,
            subject,
            content: content || '',
            tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
            fileUrl: req.file ? `/uploads/notes/${req.file.filename}` : '',
            fileName: req.file ? req.file.originalname : '',
            fileType: req.file ? req.file.mimetype : '',
            fileSize: req.file ? req.file.size : 0
        });

        // Small reward for contributing to the marketplace
        await User.findByIdAndUpdate(req.user.id, { $inc: { xp: 10, coins: 3 } });

        const populated = await note.populate('author', 'name avatar');
        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/notes?subject=Math&search=algebra&sort=recent|popular
exports.getNotes = async (req, res) => {
    try {
        const { subject, search, sort = 'recent' } = req.query;

        const match = { isRemoved: false };
        if (subject) match.subject = subject;
        if (search) {
            match.$or = [
                { title: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }

        let notes = await Note.find(match)
            .populate('author', 'name avatar')
            .lean();

        notes = notes.map(n => ({ ...n, bookmarkCount: n.bookmarkedBy.length }));

        if (sort === 'popular') {
            notes.sort((a, b) => b.bookmarkCount - a.bookmarkCount);
        } else {
            notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/notes/mine
exports.getMyNotes = async (req, res) => {
    try {
        const notes = await Note.find({ author: req.user.id }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/notes/bookmarked
exports.getBookmarkedNotes = async (req, res) => {
    try {
        const notes = await Note.find({ bookmarkedBy: req.user.id, isRemoved: false })
            .populate('author', 'name avatar')
            .sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/notes/top-creators
exports.getTopCreators = async (req, res) => {
    try {
        const results = await Note.aggregate([
            { $match: { isRemoved: false } },
            { $project: { author: 1, bookmarkCount: { $size: '$bookmarkedBy' } } },
            { $group: { _id: '$author', totalBookmarks: { $sum: '$bookmarkCount' }, noteCount: { $sum: 1 } } },
            { $sort: { totalBookmarks: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 0,
                    userId: '$user._id',
                    name: '$user.name',
                    avatar: '$user.avatar',
                    totalBookmarks: 1,
                    noteCount: 1
                }
            }
        ]);
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/notes/:id
exports.getNoteById = async (req, res) => {
    try {
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('author', 'name avatar');

        if (!note || note.isRemoved) return res.status(404).json({ message: 'Note not found' });
        res.json(note);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/notes/:id/download
exports.downloadNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || note.isRemoved) return res.status(404).json({ message: 'Note not found' });
        if (!note.fileUrl) return res.status(404).json({ message: 'This note has no attached file' });

        const absolutePath = path.join(__dirname, '../../', note.fileUrl);
        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ message: 'File missing from server' });
        }

        note.downloadCount += 1;
        await note.save();

        res.download(absolutePath, note.fileName);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/notes/:id/bookmark  (toggles bookmark on/off)
exports.toggleBookmark = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note || note.isRemoved) return res.status(404).json({ message: 'Note not found' });

        const alreadyBookmarked = note.bookmarkedBy.some(id => id.toString() === req.user.id);

        if (alreadyBookmarked) {
            note.bookmarkedBy = note.bookmarkedBy.filter(id => id.toString() !== req.user.id);
        } else {
            note.bookmarkedBy.push(req.user.id);
            // Bonus XP to the author each time someone new bookmarks their note
            if (note.author.toString() !== req.user.id) {
                await User.findByIdAndUpdate(note.author, { $inc: { xp: 5, coins: 1 } });
            }
        }

        await note.save();
        res.json({ bookmarked: !alreadyBookmarked, bookmarkCount: note.bookmarkedBy.length });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);
        if (!note) return res.status(404).json({ message: 'Note not found' });
        if (note.author.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You can only delete your own notes' });
        }
        await note.deleteOne();
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/notes/:id/flag  (any student can flag a note for admin review)
exports.flagNote = async (req, res) => {
    try {
        const { reason } = req.body;
        const note = await Note.findByIdAndUpdate(
            req.params.id,
            { flagged: true, flagReason: reason || 'No reason provided' },
            { new: true }
        );
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Note flagged for review' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};