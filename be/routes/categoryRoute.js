const express = require("express");
const router = express.Router();
const {
  getChildCategories,
  getParentCategories,
  getPopularCategories,
  getCategoryChildrenById,
  getAttributesByCategoryId,
} = require("../controllers/categoryController");

// GET /api/categories/childCategories
router.get("/childCategories", getChildCategories);

// GET /api/categories/parent
router.get("/parent", getParentCategories);

// GET /api/categories/popular
router.get("/popular", getPopularCategories);

// GET /api/categories/:categoryId/children  (alias: /childCategories/:categoryId)
router.get("/childCategories/:categoryId", getCategoryChildrenById);
router.get("/:categoryId/children", getCategoryChildrenById);

// GET /api/categories/:categoryId/attributes
router.get("/attributes/:categoryId", getAttributesByCategoryId);
router.get("/:categoryId/attributes", getAttributesByCategoryId);

module.exports = router;
