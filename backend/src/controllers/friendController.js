const Friend = require('../models/Friend');
const User = require('../models/User');
const Message = require('../models/Message');

// Get my friends list
exports.getFriends = async (req, res) => {
    try {
        const friendships = await Friend.find({
            $or: [
                { requester: req.user.id, status: 'accepted' },
                { recipient: req.user.id, status: 'accepted' }
            ]
        }).populate('requester recipient', 'name email isOnline lastSeen');

        const friends = friendships.map(f => {
            const friend = f.requester._id.toString() === req.user.id
                ? f.recipient
                : f.requester;
            return { ...friend.toObject(), friendshipId: f._id };
        });

        res.json(friends);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get pending requests
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await Friend.find({
            recipient: req.user.id,
            status: 'pending'
        }).populate('requester', 'name email isOnline lastSeen');

        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Send friend request
exports.sendRequest = async (req, res) => {
    try {
        const { recipientId } = req.body;

        if (recipientId === req.user.id) {
            return res.status(400).json({ message: 'Cannot add yourself' });
        }

        // Check if already friends or pending
        const existing = await Friend.findOne({
            $or: [
                { requester: req.user.id, recipient: recipientId },
                { requester: recipientId, recipient: req.user.id }
            ]
        });

        if (existing) {
            return res.status(400).json({ message: 'Request already exists' });
        }

        const request = await Friend.create({
            requester: req.user.id,
            recipient: recipientId
        });

        await request.populate('requester recipient', 'name email');
        res.status(201).json(request);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Accept or reject request
exports.respondToRequest = async (req, res) => {
    try {
        const { requestId, action } = req.body;

        const request = await Friend.findById(requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = action === 'accept' ? 'accepted' : 'rejected';
        await request.save();

        res.json({ message: `Request ${request.status}`, request });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Remove friend
exports.removeFriend = async (req, res) => {
    try {
        await Friend.findOneAndDelete({
            $or: [
                { requester: req.user.id, recipient: req.params.id },
                { requester: req.params.id, recipient: req.user.id }
            ]
        });
        res.json({ message: 'Friend removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get friend recommendations
exports.getRecommendations = async (req, res) => {
    try {
        // Get existing connections
        const existing = await Friend.find({
            $or: [
                { requester: req.user.id },
                { recipient: req.user.id }
            ]
        });

        const connectedIds = existing.map(f =>
            f.requester.toString() === req.user.id
                ? f.recipient.toString()
                : f.requester.toString()
        );

        connectedIds.push(req.user.id);

        // Find users not connected
        const recommendations = await User.find({
            _id: { $nin: connectedIds },
            role: 'student'
        })
            .select('name email isOnline lastSeen subjects')
            .limit(6);

        res.json(recommendations);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Search users
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const users = await User.find({
            _id: { $ne: req.user.id },
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).select('name email isOnline lastSeen').limit(10);

        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get messages between two users
exports.getMessages = async (req, res) => {
    try {
        const { friendId } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: req.user.id, recipient: friendId },
                { sender: friendId, recipient: req.user.id }
            ]
        }).sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { sender: friendId, recipient: req.user.id, read: false },
            { read: true, readAt: new Date() }
        );

        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Get conversations list
exports.getConversations = async (req, res) => {
    try {
        const friendships = await Friend.find({
            $or: [
                { requester: req.user.id, status: 'accepted' },
                { recipient: req.user.id, status: 'accepted' }
            ]
        }).populate('requester recipient', 'name email isOnline lastSeen');

        const conversations = await Promise.all(
            friendships.map(async (f) => {
                const friend = f.requester._id.toString() === req.user.id
                    ? f.recipient
                    : f.requester;

                const lastMessage = await Message.findOne({
                    $or: [
                        { sender: req.user.id, recipient: friend._id },
                        { sender: friend._id, recipient: req.user.id }
                    ]
                }).sort({ createdAt: -1 });

                const unreadCount = await Message.countDocuments({
                    sender: friend._id,
                    recipient: req.user.id,
                    read: false
                });

                return {
                    friend: friend.toObject(),
                    lastMessage,
                    unreadCount
                };
            })
        );

        res.json(conversations);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};