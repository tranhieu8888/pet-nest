const express = require("express");
const router = express.Router();
const { getStaffDashboardStats } = require("../controllers/staffDashboardController");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");
const { ROLES } = require("../config/role");

router.get("/stats", verifyToken, authorizeRoles(ROLES.STAFF), getStaffDashboardStats);

module.exports = router;
