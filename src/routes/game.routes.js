const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const game_controller = require('../controller/Game_controller/game.controller');
const { isAdmin } = require('../service/repository/Admin.service');

const router = express.Router();

// No Auth Social Routes

router.post('/user-details', game_controller.getuserDetailsForGame)
router.post('/user-coins-update', game_controller.gameTransaction)
// Auth Routes
router.use(authMiddleware)

router.get('/get-game-list', game_controller.getGameLists);


module.exports = router;