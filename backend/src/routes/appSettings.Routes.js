import express from 'express';
import { getAppSettings, updateAppSettings } from '../controllers/appSettings.Controller.js';
import { protect } from '../middleware/auth.js';
 
const router = express.Router();
 
// GET is public — even non-logged-in users can read settings (for Welcome page logo)
router.get('/', getAppSettings);
 
// PUT requires login + admin check inside controller
router.put('/', protect, updateAppSettings);
 
export default router;