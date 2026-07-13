const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getFriends,
    getPendingRequests,
    sendRequest,
    respondToRequest,
    removeFriend,
    getRecommendations,
    searchUsers,
    getMessages,
    getConversations
} = require('../controllers/friendController');

router.get('/', auth, getFriends);
router.get('/pending', auth, getPendingRequests);
router.get('/recommendations', auth, getRecommendations);
router.get('/conversations', auth, getConversations);
router.get('/search', auth, searchUsers);
router.get('/messages/:friendId', auth, getMessages);
router.post('/request', auth, sendRequest);
router.put('/respond', auth, respondToRequest);
router.delete('/:id', auth, removeFriend);

module.exports = router;