const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const leaderboard_controller = require('../controller/leaderboard_controller/top_users.controller')

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/top-list', leaderboard_controller.topSenderReceiverList);

module.exports = router;