const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');

const live_controller = require('../controller/Live_controller/Live.controller');
const pk_controller = require('../controller/pk_controller/Pk.controller');
// const stream_controller = require('../controller/Stream_controller/Stream.controller');

const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/live-list', live_controller.get_live);
router.post('/start-pk', pk_controller.startPK);
router.post('/end-pk', pk_controller.endPK);

module.exports = router;