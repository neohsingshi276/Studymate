const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const {
    createNote,
    getNotes,
    getMyNotes,
    getBookmarkedNotes,
    getTopCreators,
    getNoteById,
    downloadNote,
    toggleBookmark,
    deleteNote,
    flagNote
} = require('../controllers/noteController');

// Where uploaded note files live on disk: backend/uploads/notes
const uploadDir = path.join(__dirname, '../../uploads/notes');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const upload = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    fileFilter: (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Unsupported file type. Allowed: PDF, JPG, PNG, GIF, WEBP, DOC, DOCX'));
    }
});

// Wraps multer so a bad file type returns a clean JSON 400 instead of crashing
const uploadSingle = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ message: err.message });
        next();
    });
};

// IMPORTANT: specific routes before the '/:id' route so they aren't swallowed by it
router.get('/mine', auth, getMyNotes);
router.get('/bookmarked', auth, getBookmarkedNotes);
router.get('/top-creators', auth, getTopCreators);

router.get('/', auth, getNotes);
router.post('/', auth, uploadSingle, createNote);
router.get('/:id', auth, getNoteById);
router.get('/:id/download', auth, downloadNote);
router.post('/:id/bookmark', auth, toggleBookmark);
router.post('/:id/flag', auth, flagNote);
router.delete('/:id', auth, deleteNote);

module.exports = router;