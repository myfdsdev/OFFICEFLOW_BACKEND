import express from 'express';
import {
  createCompany,
  getCompanies,
  filterCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from '../controllers/company.Controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.get('/filter', filterCompanies);

router.post('/', createCompany);
router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

export default router;