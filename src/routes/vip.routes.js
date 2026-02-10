const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const vip_controller = require('../controller/Vip_controller/Vip.controller');

const router = express.Router();

// Permissions routes (no auth required)

// Auth follow Routes
router.use(authMiddleware)

router.post('/create', vip_controller.createVip_levelList);
router.get('/list-wp', vip_controller.getVip_level_WP);
router.post('/buy', vip_controller.acquire_vip);
router.get('/permissions', vip_controller.getPermissions);
router.post('/toggle-permissions', vip_controller.togglePermissions);

module.exports = router;