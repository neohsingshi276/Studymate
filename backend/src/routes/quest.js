const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getPosition,
    savePosition,
    getProgress,
    completeCheckpoint,
} = require('../controllers/questController');

router.get('/position', auth, getPosition);
router.post('/position', auth, savePosition);
router.get('/progress', auth, getProgress);
router.post('/checkpoint/:number/complete', auth, completeCheckpoint);

module.exports = router;
