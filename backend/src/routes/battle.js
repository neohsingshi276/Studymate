const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getBattleQuestions,
    checkAnswer,
    submitBattleResult,
    getBattleHistory,
    getAvailableSubjects
} = require('../controllers/battleController');

router.get('/subjects', auth, getAvailableSubjects);
router.get('/questions', auth, getBattleQuestions);
router.post('/answer', auth, checkAnswer);
router.post('/result', auth, submitBattleResult);
router.get('/history', auth, getBattleHistory);

module.exports = router;
