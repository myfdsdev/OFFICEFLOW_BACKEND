import express from 'express';
import {
  sendMessage,
  getConversation,
  getMyConversations,
  filterMessages,
  markConversationRead,
  editMessage,
  deleteMessage,
  togglePin,
  toggleMute,
  createMessageReminder,
  broadcastMessage,
} from '../controllers/message.Controller.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/conversations', getMyConversations);
router.get('/filter', filterMessages);
router.get('/conversation/:userId', getConversation);
router.put('/mark-read/:senderId', markConversationRead);
router.post('/broadcast', adminOnly, broadcastMessage);

router.post('/:id/reminder', createMessageReminder);
router.put('/:id/pin', togglePin);
router.put('/:id/mute', toggleMute);

router.post('/', sendMessage);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);

export default router;