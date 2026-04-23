import express from 'express';
import {
  createGroup,
  getAllGroups,
  filterGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
} from '../controllers/group.Controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/filter', filterGroups);

router.post('/', createGroup);
router.get('/', getAllGroups);
router.get('/:id', getGroupById);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

export default router;