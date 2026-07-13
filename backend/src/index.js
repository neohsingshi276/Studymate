const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const User = require('./models/User');
const Message = require('./models/Message');

const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const habitRoutes = require('./routes/habits');
const studyPlanRoutes = require('./routes/studyPlan');
const progressRoutes = require('./routes/progress_route');   // with other require
const assistantRoutes = require('./routes/assistant_route');
const battleRoutes = require('./routes/battle');
const noteRoutes = require('./routes/notes');
const friendRoutes = require('./routes/friends');
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/progress', progressRoutes)
app.use('/api/assistant', assistantRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/friends', friendRoutes);
app.get('/', (req, res) => {
    res.json({ message: 'StudyMate API is running!' });
});

// Online users map
const onlineUsers = new Map();

io.on('connection', async (socket) => {
    const token = socket.handshake.auth.token;

    if (!token) return socket.disconnect();

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Set user online
        onlineUsers.set(userId, socket.id);
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
        io.emit('user_online', { userId });

        // Join personal room
        socket.join(userId);

        // Send message
        socket.on('send_message', async ({ recipientId, content }) => {
            try {
                const message = await Message.create({
                    sender: userId,
                    recipient: recipientId,
                    content
                });

                await message.populate('sender', 'name');

                // Send to recipient if online
                io.to(recipientId).emit('receive_message', message);

                // Send back to sender
                socket.emit('message_sent', message);
            } catch (err) {
                console.error('Message error:', err);
            }
        });

        // Mark messages as read
        socket.on('mark_read', async ({ senderId }) => {
            await Message.updateMany(
                { sender: senderId, recipient: userId, read: false },
                { read: true, readAt: new Date() }
            );
            // Notify sender that messages were read
            io.to(senderId).emit('messages_read', { by: userId });
        });

        // Typing indicator
        socket.on('typing', ({ recipientId }) => {
            io.to(recipientId).emit('user_typing', { userId });
        });

        socket.on('stop_typing', ({ recipientId }) => {
            io.to(recipientId).emit('user_stop_typing', { userId });
        });

        // Disconnect
        socket.on('disconnect', async () => {
            onlineUsers.delete(userId);
            await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date()
            });
            io.emit('user_offline', { userId });
        });

    } catch (err) {
        socket.disconnect();
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully');
        server.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log('MongoDB connection error:', err);
    });