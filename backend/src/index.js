const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const assignmentRoutes = require('./routes/assignments');
const habitRoutes = require('./routes/habits');
const studyPlanRoutes = require('./routes/studyPlan');
const progressRoutes = require('./routes/progress_route');   // with other require
const assistantRoutes = require('./routes/assistant_route');
const battleRoutes = require('./routes/battle');
const noteRoutes = require('./routes/notes');
const app = express();

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
app.get('/', (req, res) => {
    res.json({ message: 'StudyMate API is running!' });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully');
        app.listen(process.env.PORT, () => {
            console.log(`Server running on port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log('MongoDB connection error:', err);
    });