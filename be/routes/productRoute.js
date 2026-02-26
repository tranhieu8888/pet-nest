const express = require("express");
const router = express.Router();
const {
  getProductDetailsByCategory,
  getBestSellingProducts,
  getProductById,
} = require("../controllers/productController");

// GET /api/products/best-selling
router.get("/best-selling", getBestSellingProducts);

// GET /api/products/productById/:id
router.get("/productById/:id", getProductById);

// GET /api/products/productDetailsByCategory/:categoryId
router.get(
  "/productDetailsByCategory/:categoryId",
  getProductDetailsByCategory,
);

module.exports = router;
