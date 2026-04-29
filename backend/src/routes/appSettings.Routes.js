import express from 'express';
import { getAppSettings, updateAppSettings } from '../controllers/appSettings.Controller.js';
import { protect } from '../middleware/auth.js';
<<<<<<< HEAD
 
const router = express.Router();
 
// GET is public — even non-logged-in users can read settings (for Welcome page logo)
router.get('/', getAppSettings);
 
// PUT requires login + admin check inside controller
router.put('/', protect, updateAppSettings);
 
=======

const router = express.Router();

// GET is public — even non-logged-in users can read settings (for Welcome page logo)
router.get('/', getAppSettings);

// PUT requires login + admin check inside controller
router.put('/', protect, updateAppSettings);

>>>>>>> 686fead (feat: implement app settings management with admin controls)
export default router;