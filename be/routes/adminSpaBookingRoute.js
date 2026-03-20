const express = require("express");
const router = express.Router();

const {
  getAdminSpaBookings,
  getAdminSpaBookingById,
} = require("../controllers/adminSpaBookingController");

const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");
const { ROLES } = require("../config/role");

// Admin xem danh sách booking có tìm kiếm + phân trang
router.get("/", verifyToken, authorizeRoles(ROLES.ADMIN), getAdminSpaBookings);

// Admin xem chi tiết 1 booking
router.get(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  getAdminSpaBookingById
);

module.exports = router;
