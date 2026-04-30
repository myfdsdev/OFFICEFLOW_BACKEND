import express from 'express';
import {
  listShifts,
  createShift,
  updateShift,
  deleteShift,
  assignShiftToUser,
} from '../controllers/shift.Controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, listShifts);
router.post('/', protect, createShift);
router.put('/assign/:userId', protect, assignShiftToUser);
router.put('/:id', protect, updateShift);
router.delete('/:id', protect, deleteShift);

export default router;
