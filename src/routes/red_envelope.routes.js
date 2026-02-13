const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
    getRedEnvelopeGraph
} = require('../controller/red_envelope_controller/red_envelope.controller');

const router = express.Router();

// Protected routes (auth required)
router.use(authMiddleware);

/**
 * Get complete red envelope graph with all details, records, and verification
 * POST /api/red-envelope/graph
 */
router.post('/graph', getRedEnvelopeGraph);

module.exports = router;
