import express from 'express';
import {
  getProjectMembers,
  filterProjectMembers,
  addProjectMember,
  removeProjectMember,
  updateMemberRole,
} from '../controllers/projectMember.Controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/filter', filterProjectMembers);

router.get('/', getProjectMembers);
router.post('/', addProjectMember);
router.put('/:id', updateMemberRole);
router.delete('/:id', removeProjectMember);

export default router;