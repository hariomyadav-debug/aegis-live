const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const level_controller = require('../controller/Level_controller/level.controller');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/create', level_controller.createLevelList);
router.get('/list', level_controller.get_all_levels);

module.exports = router;