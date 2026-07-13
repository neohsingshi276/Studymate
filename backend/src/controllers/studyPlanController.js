const StudyPlan = require('../models/StudyPlan');
const { generateStudyPlan, generateWeeklyReport } = require('../services/geminiService');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const Habit = require('../models/Habit');

// Generate new study plan
exports.generatePlan = async (req, res) => {
    try {
        const { subjects, examDate, hoursPerDay } = req.body;

        // Call Gemini AI
        const aiPlan = await generateStudyPlan(subjects, examDate, hoursPerDay);

        // Save to database
        const studyPlan = await StudyPlan.create({
            user: req.user.id,
            subjects,
            examDate,
            hoursPerDay,
            plan: aiPlan.plan,
            summary: aiPlan.summary
        });

        // Give XP for generating a plan
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { xp: 30 }
        });

        res.status(201).json({ studyPlan, message: 'Study plan generated!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to generate plan', error: err.message });
    }
};

// Get latest study plan
exports.getLatestPlan = async (req, res) => {
    try {
        const plan = await StudyPlan.findOne({
            user: req.user.id,
            isActive: true
        }).sort({ createdAt: -1 });
        res.json(plan);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Mark session as complete
exports.completeSession = async (req, res) => {
    try {
        const { planId, dayIndex, sessionIndex } = req.body;
        const plan = await StudyPlan.findById(planId);

        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        plan.plan[dayIndex].sessions[sessionIndex].completed = true;
        await plan.save();

        // Give XP for completing session
        await User.findByIdAndUpdate(req.user.id, {
            $inc: { xp: 20, coins: 5 }
        });

        res.json({ message: 'Session completed! +20 XP', plan });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get weekly report
exports.getWeeklyReport = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const assignments = await Assignment.find({ user: req.user.id });
        const habits = await Habit.find({ user: req.user.id }).limit(7);

        const habitsCompleted = habits.reduce((acc, h) => {
            const fields = ['reviewedNotes', 'didPracticeQuestions', 'sleptBefore12', 'didPomodoro', 'drankWater', 'exercised'];
            return acc + fields.filter(f => h[f]).length;
        }, 0);

        const studyData = {
            habitsCompleted,
            assignmentsCompleted: assignments.filter(a => a.status === 'completed').length,
            assignmentsPending: assignments.filter(a => a.status === 'pending').length,
            streak: user.streak,
            xp: user.xp,
            subjects: user.subjects?.map(s => s.name)
        };

        const report = await generateWeeklyReport(studyData);
        res.json(report);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};