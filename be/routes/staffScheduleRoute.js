const express = require("express");
const router = express.Router();

const { ROLES } = require("../config/role");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");

const { getMySchedules } = require("../controllers/staffScheduleController");

// STAFF xem lịch của chính mình
router.get("/", verifyToken, authorizeRoles(ROLES.STAFF), getMySchedules);

module.exports = router;
