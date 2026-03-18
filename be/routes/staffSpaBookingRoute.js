const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");
const { ROLES } = require("../config/role");

const {
  getStaffSpaBookings,
  getStaffSpaBookingById,
  confirmSpaBooking,
  rejectSpaBooking,
  completeSpaBooking,
  markAsPaid,
} = require("../controllers/staffSpaBookingController");

router.get("/", verifyToken, authorizeRoles(ROLES.STAFF), getStaffSpaBookings);
router.get(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.STAFF),
  getStaffSpaBookingById
);

router.patch(
  "/:id/confirm",
  verifyToken,
  authorizeRoles(ROLES.STAFF),
  confirmSpaBooking
);
router.patch(
  "/:id/reject",
  verifyToken,
  authorizeRoles(ROLES.STAFF),
  rejectSpaBooking
);
router.patch(
  "/:id/complete",
  verifyToken,
  authorizeRoles(ROLES.STAFF),
  completeSpaBooking
);

router.patch("/:id/pay", verifyToken, authorizeRoles(ROLES.STAFF), markAsPaid);

module.exports = router;
