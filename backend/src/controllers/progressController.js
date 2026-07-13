const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Habit = require('../models/Habit');
const StudyPlan = require('../models/StudyPlan');

exports.getProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');

        // --- Assignments ---
        const assignments = await Assignment.find({ user: userId });
        const assignmentStats = {
            total: assignments.length,
            completed: assignments.filter(a => a.status === 'completed').length,
            inProgress: assignments.filter(a => a.status === 'in-progress').length,
            pending: assignments.filter(a => a.status === 'pending').length,
        };

        // Assignments by subject
        const bySubject = {};
        assignments.forEach(a => {
            if (!bySubject[a.subject]) bySubject[a.subject] = { total: 0, completed: 0 };
            bySubject[a.subject].total++;
            if (a.status === 'completed') bySubject[a.subject].completed++;
        });
        const subjectMastery = Object.entries(bySubject).map(([name, data]) => ({
            name,
            total: data.total,
            completed: data.completed,
            percent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0
        }));

        // --- Habits (last 7 days) ---
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        const habits = await Habit.find({ user: userId, date: { $in: last7Days } });
        const habitFields = ['reviewedNotes', 'didPracticeQuestions', 'sleptBefore12', 'didPomodoro', 'drankWater', 'exercised'];

        const habitHistory = last7Days.map(date => {
            const habit = habits.find(h => h.date === date);
            const completed = habit ? habitFields.filter(f => habit[f]).length : 0;
            const studyHours = habit ? habit.studyHours : 0;
            return { date, completed, total: habitFields.length, studyHours };
        });

        const totalHabitsCompleted = habitHistory.reduce((acc, h) => acc + h.completed, 0);
        const totalPossible = habitHistory.length * habitFields.length;
        const habitCompletionRate = totalPossible > 0 ? Math.round((totalHabitsCompleted / totalPossible) * 100) : 0;

        // --- Study Plan sessions ---
        const studyPlan = await StudyPlan.findOne({ user: userId, isActive: true }).sort({ createdAt: -1 });
        let sessionStats = { total: 0, completed: 0, completionRate: 0 };
        if (studyPlan) {
            let total = 0, completed = 0;
            studyPlan.plan.forEach(day => {
                day.sessions.forEach(s => {
                    total++;
                    if (s.completed) completed++;
                });
            });
            sessionStats = {
                total,
                completed,
                completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
            };
        }

        res.json({
            user: {
                xp: user.xp,
                coins: user.coins,
                streak: user.streak,
                badges: user.badges,
                subjects: user.subjects
            },
            assignments: assignmentStats,
            subjectMastery,
            habitHistory,
            habitCompletionRate,
            sessions: sessionStats
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
