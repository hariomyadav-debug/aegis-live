const express = require('express');
const {authMiddleware} = require('../middleware/authMiddleware');



const router = express.Router();

// No Auth follow Routes

// Auth follow Routes
router.use(authMiddleware)

router.post('/token', live_controller.get_token);


module.exports = router;