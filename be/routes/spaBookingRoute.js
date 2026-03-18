const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");
const { ROLES } = require("../config/role");

const {
  createSpaBooking,
  getMySpaBookings,
  getSpaBookingById,
  cancelSpaBooking,
} = require("../controllers/spaBookingController");

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "spa booking route ok",
  });
});

// CUSTOMER phải login mới được tạo booking
router.post("/", verifyToken, authorizeRoles(ROLES.CUSTOMER), createSpaBooking);

// CUSTOMER xem booking của chính mình
router.get(
  "/my-bookings",
  verifyToken,
  authorizeRoles(ROLES.CUSTOMER),
  getMySpaBookings
);

// CUSTOMER xem chi tiết booking của mình
router.get(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.CUSTOMER),
  getSpaBookingById
);

// CUSTOMER hủy booking của mình
router.patch(
  "/:id/cancel",
  verifyToken,
  authorizeRoles(ROLES.CUSTOMER),
  cancelSpaBooking
);

module.exports = router;
