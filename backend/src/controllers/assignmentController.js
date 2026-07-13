const Assignment = require('../models/Assignment');
const User = require('../models/User');

// Get all assignments for logged in user
exports.getAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ user: req.user.id }).sort({ dueDate: 1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Create assignment
exports.createAssignment = async (req, res) => {
    try {
        const { title, subject, description, dueDate, priority } = req.body;
        const assignment = await Assignment.create({
            user: req.user.id,
            title,
            subject,
            description,
            dueDate,
            priority
        });
        res.status(201).json(assignment);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Update assignment status
exports.updateAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // If completing assignment, give XP
        if (req.body.status === 'completed' && assignment.status !== 'completed') {
            await User.findByIdAndUpdate(req.user.id, {
                $inc: { xp: assignment.xpReward, coins: 10 }
            });
        }

        const updated = await Assignment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
    try {
        await Assignment.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });
        res.json({ message: 'Assignment deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};