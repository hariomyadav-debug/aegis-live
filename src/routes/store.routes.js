const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const store_controller = require('../controller/store_controller/store.controller');


const router = express.Router();

// No Auth Social Routes

// Auth Social Routes
router.use(authMiddleware)

router.post('/create-frame', store_controller.createFrameList);
router.get('/get-frame', store_controller.getFrameList);

router.get('/get-store', store_controller.getStoreList)

module.exports = router;