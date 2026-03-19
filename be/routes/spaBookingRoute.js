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

router.post("/", verifyToken, authorizeRoles(ROLES.CUSTOMER), createSpaBooking);

router.get(
  "/my",
  verifyToken,
  authorizeRoles(ROLES.CUSTOMER),
  getMySpaBookings
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.CUSTOMER),
  getSpaBookingById
);

router.patch(
  "/:id/cancel",
  verifyToken,
  authorizeRoles(ROLES.CUSTOMER),
  cancelSpaBooking
);

module.exports = router;
