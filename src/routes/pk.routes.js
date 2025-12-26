const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');
const Pk_controller = require('../controller/pk_controller/Pk.controller');
const router = express.Router();
// Auth follow Routes
router.use(authMiddleware)
router.post('/start-battle', Pk_controller.startPK);
router.post('/end-battle', Pk_controller.endPK);
module.exports = router;