const express = require("express");
const router = express.Router();
const {
  getProductById2,
  getTopSellingProducts,
  getAllProducts,
  getAllProductsPublic,
  getProductVariantsByProductId,
  getProductsBySearch,
  getAllBestSellingProducts,
  getAllWorstSellingProducts,
  getChildAttributesByProductId,
  getChildAttributesByParentId,
  getProductById,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  createProduct,
  deleteProduct,
  getProductsByCategory,
  getProductDetailsByCategory,
  updateProduct,
  getImportBatchesByVariantId,
  createImportBatch,
  updateImportBatch,
  deleteImportBatch,
  updateProductVariantCostPrice,
  getProductDashboardData,
} = require("../controllers/product");
const { upload } = require("../config/cloudinary");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");

// --- PUBLIC & ANALYTICS ROUTES ---

// Get list of top selling products
router.get("/top-selling", getTopSellingProducts);

// Get dashboard statistics (Admin only)
router.get("/dashboard", verifyToken, authorizeRoles(8), getProductDashboardData);

// Search products by name
router.get("/search/:search", getProductsBySearch);

// Get all products (Public - anyone can view)
router.get("/all", getAllProductsPublic);

// Get all products (Requires staff/admin role)
router.get("/", verifyToken, authorizeRoles(0), getAllProducts);


// --- PRODUCT VARIANT ROUTES ---

// Get variants for a specific product
router.get("/product-variant/:productId", verifyToken, authorizeRoles(0), getProductVariantsByProductId);

// Create a new product variant with images
router.post("/:productId/variant", upload.array("images"), createProductVariant);

// Update existing variant details and images
router.put("/variant/:variantId", upload.array("images"), updateProductVariant);

// Delete a product variant
router.delete("/variant/:variantId", deleteProductVariant);

// Update cost price for a specific variant
router.put("/variant/:variantId/cost-price", updateProductVariantCostPrice);


// --- ATTRIBUTE ROUTES ---

// Get child attributes by product ID
router.get("/child-attributes/:productId", verifyToken, authorizeRoles(0), getChildAttributesByProductId);

// Get child attributes by parent attribute ID
router.get("/child-attributes/parent/:parentId", getChildAttributesByParentId);


// --- PRODUCT MANAGEMENT ROUTES ---

// Create a new product
router.post("/", createProduct);

// Update product details
router.put("/:productId", updateProduct);

// Delete a product
router.delete("/:productId", deleteProduct);

// Get products filtered by category
router.get("/productsByCategory/:categoryId", getProductsByCategory);

// Get detailed product info by category
router.get("/productDetailsByCategory/:categoryId", getProductDetailsByCategory);

// Get single product details by ID
router.get("/productById/:id", getProductById);
router.get("/productById2/:id", getProductById2);


// --- SALES PERFORMANCE ROUTES ---

// Get all best-selling items
router.get("/best-selling", getAllBestSellingProducts);

// Get all slow-moving (worst-selling) items
router.get("/worst-selling", getAllWorstSellingProducts);


// --- INVENTORY / IMPORT BATCH ROUTES ---

// Manage import batches by variant ID
router.get("/import-batches/:variantId", verifyToken, authorizeRoles(0), getImportBatchesByVariantId);
router.post("/import-batches/:variantId", createImportBatch);

// Update or delete specific import batches
router.put("/import-batches/:batchId", updateImportBatch);
router.delete("/import-batches/:batchId", deleteImportBatch);

module.exports = router;