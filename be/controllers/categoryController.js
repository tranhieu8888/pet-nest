const Category = require("../models/category");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const Product = require("../models/product");
const Attribute = require("../models/attribute");

// ─── Helpers ────────────────────────────────────────────────────────────────

const MAX_CATEGORY_DEPTH = 3;

const getAllChildCategories = async (parentId, currentDepth = 1) => {
  if (currentDepth >= MAX_CATEGORY_DEPTH) return [];

  const children = await Category.find({ parentCategory: parentId }).select(
    "_id name description image",
  );

  const result = await Promise.all(
    children.map(async (child) => {
      const grandChildren = await getAllChildCategories(
        child._id,
        currentDepth + 1,
      );
      return { ...child.toObject(), children: grandChildren };
    }),
  );

  return result;
};

const getAllChildAttributes = async (parentId) => {
  const children = await Attribute.find({ parentId }).select(
    "_id value description parentId",
  );

  const result = await Promise.all(
    children.map(async (child) => {
      const grandChildren = await getAllChildAttributes(child._id);
      return { ...child.toObject(), children: grandChildren };
    }),
  );

  return result;
};

// ─── Controllers ────────────────────────────────────────────────────────────

/**
 * GET /categories/childCategories
 * Trả về cây category: parent -> children -> grandchildren (tối đa 3 cấp)
 */
const getChildCategories = async (req, res) => {
  try {
    const parentCategories = await Category.find({
      parentCategory: null,
    }).select("_id name description image");

    const result = await Promise.all(
      parentCategories.map(async (parent) => {
        const children = await getAllChildCategories(parent._id);
        return {
          parent: {
            _id: parent._id,
            name: parent.name,
            description: parent.description,
            image: parent.image,
          },
          children,
        };
      }),
    );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /categories/parent
 * Trả về danh sách các category gốc (không có parentCategory)
 */
const getParentCategories = async (req, res) => {
  try {
    const parentCategories = await Category.find({
      parentCategory: null,
    }).select("_id name description image");

    res.status(200).json({ success: true, data: parentCategories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /categories/popular
 * Trả về top 5 danh mục phổ biến nhất dựa trên số lượng đơn hàng.
 * Fallback: nếu không có đơn hàng, trả về 5 category con đầu tiên.
 */
const getPopularCategories = async (req, res) => {
  try {
    const parentCategories = await Category.find({
      parentCategory: null,
    }).select("_id name");

    const parentIds = parentCategories.map((c) => c._id);

    const childCategoryDocs = await Category.find({
      parentCategory: { $in: parentIds },
    }).select("_id name");

    const childIds = childCategoryDocs.map((c) => c._id);

    if (childIds.length === 0) {
      const allCategories = await Category.find()
        .select("_id name description image")
        .limit(5)
        .lean();
      return res
        .status(200)
        .json(allCategories.map((cat) => ({ ...cat, totalOrders: 0 })));
    }

    const topCategories = await Order.aggregate([
      { $unwind: "$OrderItems" },
      {
        $lookup: {
          from: "orderitems",
          localField: "OrderItems.orderItem_id",
          foreignField: "_id",
          as: "orderItemDetails",
        },
      },
      { $unwind: "$orderItemDetails" },
      {
        $lookup: {
          from: "products",
          localField: "orderItemDetails.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      { $unwind: "$productDetails.category" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.category.categoryId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $match: {
          "categoryDetails._id": { $in: childIds },
        },
      },
      {
        $group: {
          _id: "$categoryDetails._id",
          name: { $first: "$categoryDetails.name" },
          description: { $first: "$categoryDetails.description" },
          image: { $first: "$categoryDetails.image" },
          totalOrders: { $sum: "$orderItemDetails.quantity" },
        },
      },
      { $sort: { totalOrders: -1 } },
      { $limit: 5 },
    ]);

    if (topCategories.length > 0) {
      return res.status(200).json(topCategories);
    }

    // Fallback: trả về 5 danh mục con đầu tiên nếu chưa có đơn hàng
    const fallbackCategories = await Category.find({
      _id: { $in: childIds },
    })
      .select("_id name description image")
      .limit(5)
      .lean();

    const formattedCategories = fallbackCategories.map((cat) => ({
      ...cat,
      totalOrders: 0,
    }));

    res.status(200).json(formattedCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /categories/:categoryId/children
 * Trả về danh sách children trực tiếp của một category
 */
const getCategoryChildrenById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const childCategories = await Category.find({
      parentCategory: categoryId,
    }).select("_id name description image");

    res.status(200).json({
      success: true,
      parent: {
        _id: category._id,
        name: category.name,
        description: category.description,
        image: category.image,
      },
      children: childCategories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /categories/:categoryId/attributes
 * Trả về danh sách attributes (có cấu trúc cây) của một category
 */
const getAttributesByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const parentAttributes = await Attribute.find({
      categories: categoryId,
      parentId: null,
    }).select("_id value description parentId");

    const attributesWithChildren = await Promise.all(
      parentAttributes.map(async (attr) => {
        const children = await getAllChildAttributes(attr._id);
        return { ...attr.toObject(), children };
      }),
    );

    res.status(200).json({
      success: true,
      category: { _id: category._id, name: category.name },
      attributes: attributesWithChildren,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getChildCategories,
  getParentCategories,
  getPopularCategories,
  getCategoryChildrenById,
  getAttributesByCategoryId,
};
