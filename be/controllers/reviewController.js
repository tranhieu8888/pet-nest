const mongoose = require("mongoose");
const Review = require("../models/reviewModel");
const Order = require("../models/order");

// POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const images = req.files ? req.files.map((f) => ({ url: f.path })) : [];
    const userId = req.user.id;

    if (!productId || !rating) {
      return res
        .status(400)
        .json({ success: false, error: "Product ID and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, error: "Rating must be between 1 and 5" });
    }

    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return res
        .status(400)
        .json({
          success: false,
          error: "You have already reviewed this product",
        });
    }

    const review = new Review({
      userId,
      productId,
      rating,
      comment: comment || "",
      images,
    });
    const saved = await review.save();
    const populated = await Review.findById(saved._id)
      .populate("userId", "name avatar")
      .populate("productId", "name");

    res
      .status(201)
      .json({
        success: true,
        message: "Review created successfully",
        data: populated,
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/reviews/product/:productId
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId })
      .populate("userId", "name avatar")
      .lean();
    res
      .status(200)
      .json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/reviews/unreviewed/:productId
exports.getUnreviewedProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const purchasedProducts = await Order.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$OrderItems" },
      {
        $lookup: {
          from: "orderitems",
          localField: "OrderItems",
          foreignField: "_id",
          as: "orderItemDetails",
        },
      },
      { $unwind: "$orderItemDetails" },
      ...(productId
        ? [
            {
              $match: {
                "orderItemDetails.productId": new mongoose.Types.ObjectId(
                  productId,
                ),
              },
            },
          ]
        : []),
      {
        $lookup: {
          from: "products",
          localField: "orderItemDetails.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$orderItemDetails.productId",
          productName: { $first: "$productDetails.name" },
          totalQuantity: { $sum: "$orderItemDetails.quantity" },
        },
      },
    ]);

    const reviewedProducts = await Review.find({ userId }).distinct(
      "productId",
    );

    const unreviewedProducts = purchasedProducts.filter(
      (p) =>
        !reviewedProducts.some((rId) => rId.toString() === p._id.toString()),
    );

    res.status(200).json({
      success: true,
      data: {
        totalPurchasedProducts: purchasedProducts.length,
        totalReviewedProducts: reviewedProducts.length,
        unreviewedProducts,
        unreviewedCount: unreviewedProducts.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/reviews/average/:productId
exports.getAverageRating = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$productId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json({
      success: true,
      data: result[0] || { averageRating: 0, totalReviews: 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name email avatar")
      .populate("productId", "name")
      .sort({ createdAt: -1 });
    res
      .status(200)
      .json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
