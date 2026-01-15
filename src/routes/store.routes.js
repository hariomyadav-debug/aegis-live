const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const store_controller = require('../controller/store_controller/store.controller');


const router = express.Router();

// No Auth Social Routes

// Auth Social Routes
router.use(authMiddleware)

router.post('/create-frame', store_controller.createFrameList);
router.get('/get-frame', store_controller.getFrameList);
router.post('/buy-frame', store_controller.buyFrame);
router.post('/apply-frame', store_controller.applyFrame);
router.post('/remove-frame', store_controller.removeFrame);


router.post('/buy-mount', store_controller.buyMount);
router.post('/apply-mount', store_controller.applyMount);
router.post('/remove-mount', store_controller.removeMount);


router.get('/get-store', store_controller.getStoreList)
router.get('/get-equipements', store_controller.getEquipmentsList);

module.exports = router;