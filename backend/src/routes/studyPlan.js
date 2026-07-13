const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    generatePlan,
    getLatestPlan,
    completeSession,
    getWeeklyReport
} = require('../controllers/studyPlanController');

router.post('/generate', auth, generatePlan);
router.get('/latest', auth, getLatestPlan);
router.put('/complete-session', auth, completeSession);
router.get('/weekly-report', auth, getWeeklyReport);

module.exports = router;