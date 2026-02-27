const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const contributionController = require("../controller/Contribution_controller/contribution.controller");

const router = express.Router();

// Apply auth middleware to all contribution routes
router.use(authMiddleware);

// Get all time period contributions (for dashboard/index page)
router.post("/index", contributionController.index);

// Get specific time period contributions (for detailed/order page)
router.post("/order", contributionController.order);

module.exports = router;
