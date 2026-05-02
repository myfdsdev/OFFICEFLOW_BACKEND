import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getAllSalaryConfigs,
  getSalaryConfig,
  createOrUpdateSalaryConfig,
  getSalaryBoard,
  getSalaryBreakdown,
  generatePayslip,
  generatePayslipBulk,
  approvePayslip,
  markPayslipAsPaid,
  getAllPayslips,
  getMyPayslips,
  getPayslip,
  deletePayslip,
} from '../controllers/salary.Controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Salary Config routes
router.get('/config', getAllSalaryConfigs);
router.get('/config/:userId', getSalaryConfig);
router.post('/config', createOrUpdateSalaryConfig);
router.put('/config/:userId', createOrUpdateSalaryConfig);

// Salary Board
router.get('/board', getSalaryBoard);

// Salary Breakdown
router.get('/breakdown/:userId', getSalaryBreakdown);

// Payslip routes
router.post('/payslip/generate', generatePayslip);
router.post('/payslip/generate-bulk', generatePayslipBulk);
router.put('/payslip/:id/approve', approvePayslip);
router.put('/payslip/:id/mark-paid', markPayslipAsPaid);

// Payslip query routes
router.get('/payslips', getAllPayslips);
router.get('/payslips/me', getMyPayslips);
router.get('/payslips/:id', getPayslip);
router.delete('/payslips/:id', deletePayslip);

export default router;
