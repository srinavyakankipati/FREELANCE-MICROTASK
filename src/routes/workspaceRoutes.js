const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getOrCreateWorkspace,
  sendMessage,
  getChatHistory,
  uploadWorkspaceFile,
  listFiles,
  downloadWorkspaceFile,
  deleteWorkspaceFile,
  markMessagesAsRead,
} = require('../controllers/workspaceController');

// All workspace routes require authentication
router.use(protect);

// 1. Get or create workspace for a task
router.get('/task/:taskId', getOrCreateWorkspace);
router.post('/task/:taskId', getOrCreateWorkspace);

// 2. Send message
router.post('/:workspaceId/messages', sendMessage);

// 3. Get chat history (paginated)
router.get('/:workspaceId/messages', getChatHistory);

// 4. Upload file (Multer + Cloudinary)
router.post('/:workspaceId/files', upload.single('file'), uploadWorkspaceFile);

// 5. List files
router.get('/:workspaceId/files', listFiles);

// 6. Download / Delete file
router.get('/files/:fileId/download', downloadWorkspaceFile);
router.delete('/files/:fileId', deleteWorkspaceFile);

// 7. Mark messages as read
router.patch('/:workspaceId/messages/read', markMessagesAsRead);

module.exports = router;
