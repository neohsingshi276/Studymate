const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getTodayHabit,
    getHabitHistory,
    updateHabit
} = require('../controllers/habitController');

router.get('/today', auth, getTodayHabit);
router.get('/history', auth, getHabitHistory);
router.put('/today', auth, updateHabit);

module.exports = router;