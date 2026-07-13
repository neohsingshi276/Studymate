const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
    getAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment
} = require('../controllers/assignmentController');

router.get('/', auth, getAssignments);
router.post('/', auth, createAssignment);
router.put('/:id', auth, updateAssignment);
router.delete('/:id', auth, deleteAssignment);

module.exports = router;