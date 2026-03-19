const express = require("express");
const router = express.Router();

const {
  getAllSpaServices,
  getSpaServiceById,
  getSpaServiceBySlug,
} = require("../controllers/spaServiceController");

// GET all spa services
router.get("/", getAllSpaServices);

// GET spa service by id
router.get("/id/:id", getSpaServiceById);

// GET spa service by slug
router.get("/:slug", getSpaServiceBySlug);

module.exports = router;
