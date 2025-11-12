const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const live_controller = require('../controller/Live_controller/Live.controller');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/live-list', live_controller.get_live);

module.exports = router;