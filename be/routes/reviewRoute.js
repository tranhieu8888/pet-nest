const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const verifyToken = require("../middleware/auth");

// POST /api/reviews
router.post("/", verifyToken, reviewController.createReview);

// GET /api/reviews
router.get("/", reviewController.getAllReviews);

// GET /api/reviews/product/:productId
router.get("/product/:productId", reviewController.getReviewsByProduct);

// GET /api/reviews/unreviewed/:productId
router.get(
  "/unreviewed/:productId",
  verifyToken,
  reviewController.getUnreviewedProducts,
);

// GET /api/reviews/average/:productId
router.get("/average/:productId", reviewController.getAverageRating);

// DELETE /api/reviews/:id
router.delete("/:id", verifyToken, reviewController.deleteReview);

module.exports = router;
