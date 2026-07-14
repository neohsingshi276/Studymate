const QuestProgress = require('../models/QuestProgress');

const getOrCreate = async (userId) => {
    let doc = await QuestProgress.findOne({ user: userId });
    if (!doc) {
        doc = await QuestProgress.create({ user: userId, checkpoints: [] });
    }
    return doc;
};

// GET /api/quest/position
exports.getPosition = async (req, res) => {
    try {
        const doc = await getOrCreate(req.user.id);
        res.json({
            position: doc.pos_x != null && doc.pos_y != null
                ? { pos_x: doc.pos_x, pos_y: doc.pos_y }
                : null,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/quest/position  { pos_x, pos_y }
exports.savePosition = async (req, res) => {
    try {
        const { pos_x, pos_y } = req.body;
        if (!Number.isFinite(pos_x) || !Number.isFinite(pos_y)) {
            return res.status(400).json({ message: 'pos_x and pos_y must be numbers' });
        }
        const doc = await getOrCreate(req.user.id);
        doc.pos_x = pos_x;
        doc.pos_y = pos_y;
        await doc.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/quest/progress
exports.getProgress = async (req, res) => {
    try {
        const doc = await getOrCreate(req.user.id);
        res.json({ progress: doc.checkpoints });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/quest/checkpoint/:number/complete
exports.completeCheckpoint = async (req, res) => {
    try {
        const number = Number(req.params.number);
        if (!Number.isInteger(number) || number < 1) {
            return res.status(400).json({ message: 'Invalid checkpoint number' });
        }
        const doc = await getOrCreate(req.user.id);
        const existing = doc.checkpoints.find(c => c.number === number);
        if (existing) {
            existing.completed = true;
            existing.completedAt = new Date();
        } else {
            doc.checkpoints.push({ number, completed: true, completedAt: new Date() });
        }
        await doc.save();
        res.json({ progress: doc.checkpoints });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
