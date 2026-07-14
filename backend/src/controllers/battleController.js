const Question = require('../models/Question');
const BattleResult = require('../models/BattleResult');
const User = require('../models/User');

// GET /api/battle/questions?subject=Math&difficulty=medium&count=10
exports.getBattleQuestions = async (req, res) => {
    try {
        const { subject, difficulty, count = 10 } = req.query;

        const match = {};
        if (subject) match.subject = subject;
        if (difficulty) match.difficulty = difficulty;

        // Random sample from the chosen subject only.
        // We intentionally do NOT pad with questions from other subjects —
        // the player picked a specific subject and expects those questions.
        const questions = await Question.aggregate([
            { $match: match },
            { $sample: { size: Number(count) } }
        ]);

        if (!questions.length) {
            return res.json([]);
        }

        // Never send correctIndex/explanation to the client up front
        const sanitized = questions.map(q => ({
            _id: q._id,
            subject: q.subject,
            difficulty: q.difficulty,
            questionText: q.questionText,
            options: q.options
        }));

        res.json(sanitized);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/battle/answer  { questionId, selectedIndex }
exports.checkAnswer = async (req, res) => {
    try {
        const { questionId, selectedIndex } = req.body;
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        const correct = question.correctIndex === selectedIndex;
        res.json({
            correct,
            correctIndex: question.correctIndex,
            explanation: question.explanation
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/battle/result
exports.submitBattleResult = async (req, res) => {
    try {
        const { subject, difficulty, correctCount, totalQuestions, won } = req.body;

        const xpEarned = correctCount * 10 + (won ? 50 : 0);
        const coinsEarned = correctCount * 2 + (won ? 15 : 0);

        const result = await BattleResult.create({
            user: req.user.id, subject, difficulty,
            correctCount, totalQuestions, won, xpEarned, coinsEarned
        });

        const user = await User.findById(req.user.id);
        user.xp += xpEarned;
        user.coins += coinsEarned;

        const newBadges = [];
        const winCount = await BattleResult.countDocuments({ user: req.user.id, won: true });

        if (won && winCount === 1 && !user.badges.includes('Boss Slayer')) {
            user.badges.push('Boss Slayer');
            newBadges.push('Boss Slayer');
        }
        if (won && correctCount === totalQuestions && !user.badges.includes('Flawless Victory')) {
            user.badges.push('Flawless Victory');
            newBadges.push('Flawless Victory');
        }
        if (won && winCount === 10 && !user.badges.includes('Boss Hunter')) {
            user.badges.push('Boss Hunter');
            newBadges.push('Boss Hunter');
        }

        await user.save();

        res.json({
            result, xpEarned, coinsEarned, newBadges,
            totals: { xp: user.xp, coins: user.coins, badges: user.badges }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/battle/history
exports.getBattleHistory = async (req, res) => {
    try {
        const history = await BattleResult.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/battle/subjects
exports.getAvailableSubjects = async (req, res) => {
    try {
        const subjects = await Question.distinct('subject');
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
