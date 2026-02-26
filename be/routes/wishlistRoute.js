const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlistController");
const verifyToken = require("../middleware/auth");

// GET /api/wishlist
router.get("/", verifyToken, wishlistController.getWishlist);

// POST /api/wishlist/add
router.post("/add", verifyToken, wishlistController.addToWishlist);

// POST /api/wishlist/remove
router.post("/remove", verifyToken, wishlistController.removeFromWishlist);

module.exports = router;
