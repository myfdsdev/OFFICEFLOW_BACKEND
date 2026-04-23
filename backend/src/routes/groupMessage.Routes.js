import express from 'express';
import {
  sendGroupMessage,
  getGroupMessages,
  filterGroupMessages,
  editGroupMessage,
  deleteGroupMessage,
  markGroupMessageRead,
} from '../controllers/groupMessage.Controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/filter', filterGroupMessages);

router.post('/', sendGroupMessage);
router.get('/', getGroupMessages);
router.put('/:id/read', markGroupMessageRead);
router.put('/:id', editGroupMessage);
router.delete('/:id', deleteGroupMessage);

export default router;