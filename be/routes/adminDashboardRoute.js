const express = require("express");
const router = express.Router();
const { getAdminStats } = require("../controllers/adminDashboardController");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");
const { ROLES } = require("../config/role");

router.get("/stats", verifyToken, authorizeRoles(ROLES.ADMIN), getAdminStats);

module.exports = router;
