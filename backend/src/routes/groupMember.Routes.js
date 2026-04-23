import express from 'express';
import {
  getGroupMembers,
  filterGroupMembers,
  addGroupMember,
  removeGroupMember,
  updateGroupMemberRole,
} from '../controllers/groupMember.Controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/filter', filterGroupMembers);

router.get('/', getGroupMembers);
router.post('/', addGroupMember);
router.put('/:id', updateGroupMemberRole);
router.delete('/:id', removeGroupMember);

export default router;