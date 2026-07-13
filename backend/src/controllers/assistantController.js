const { chatWithAssistant } = require('../services/geminiService');
const User = require('../models/User');

exports.chat = async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: 'Messages array is required' });
        }

        const user = await User.findById(req.user.id).select('subjects');
        const userSubjects = user?.subjects?.map(s => s.name) || [];

        const reply = await chatWithAssistant(messages, userSubjects);

        // Give small XP for using assistant
        await User.findByIdAndUpdate(req.user.id, { $inc: { xp: 5 } });

        res.json({ reply });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to get response', error: err.message });
    }
};
