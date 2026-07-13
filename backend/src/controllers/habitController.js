const Habit = require('../models/Habit');
const User = require('../models/User');

// Get today's habit
exports.getTodayHabit = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let habit = await Habit.findOne({ user: req.user.id, date: today });
        if (!habit) {
            habit = await Habit.create({ user: req.user.id, date: today });
        }
        res.json(habit);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get habit history (last 7 days)
exports.getHabitHistory = async (req, res) => {
    try {
        const habits = await Habit.find({ user: req.user.id })
            .sort({ date: -1 })
            .limit(7);
        res.json(habits);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update today's habit
exports.updateHabit = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const habit = await Habit.findOneAndUpdate(
            { user: req.user.id, date: today },
            req.body,
            { new: true, upsert: true }
        );

        // Count completed habits
        const fields = ['reviewedNotes', 'didPracticeQuestions', 'sleptBefore12', 'didPomodoro', 'drankWater', 'exercised'];
        const completedCount = fields.filter(f => habit[f]).length;

        // Give XP if all habits completed
        if (completedCount === fields.length) {
            await User.findByIdAndUpdate(req.user.id, {
                $inc: { xp: 100, coins: 20 }
            });
        }

        res.json({ habit, completedCount });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};