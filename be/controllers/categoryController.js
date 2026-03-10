const Category = require("../models/category");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");
const Product = require("../models/product");
const Attribute = require("../models/attribute");
const { cloudinary } = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");

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
const getAllCategoriesPopular = async (req, res) => {
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

const getChildCategoriesByParentId = async (req, res) => {
  try {
    const parentId = req.params.parentId;

    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: "Parent ID is required",
      });
    }

    const childCategories = await Category.find({
      parentCategory: parentId,
    }).select("_id name description image");

    res.status(200).json({
      success: true,
      data: childCategories,
    });
  } catch (error) {
    console.error("Error getting child categories:", error);
    res.status(500).json({
      success: false,
      message: "Error getting child categories",
      error: error.message,
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;
    let imageUrl = null;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    if (parentCategory) {
      const parentExists = await Category.findById(parentCategory);
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          message: "Parent category not found",
        });
      }
    }

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "categories",
        });
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
        });
      }
    }

    const newCategory = new Category({
      name,
      description: description || "",
      image: imageUrl,
      parentCategory: parentCategory || null,
    });

    const savedCategory = await newCategory.save();

    res.status(201).json({
      success: true,
      data: savedCategory,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createChildCategory = async (req, res) => {
  try {
    const { parentId } = req.params;
    const { name, description } = req.body;
    let imageUrl = null;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    if (!parentId) {
      return res.status(400).json({
        success: false,
        message: "Parent category ID is required",
      });
    }

    const parentCategory = await Category.findById(parentId);
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: "Parent category not found",
      });
    }

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "categories",
        });
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Error uploading image",
        });
      }
    }

    const newCategory = new Category({
      name,
      description: description || "",
      image: imageUrl,
      parentCategory: parentId,
    });

    const savedCategory = await newCategory.save();

    res.status(201).json({
      success: true,
      data: savedCategory,
    });
  } catch (error) {
    console.error("Error creating child category:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, parentCategory } = req.body;
    let imageUrl;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    if (req.file) {
      if (category.image) {
        try {
          const urlParts = category.image.split("/");
          const filename = urlParts[urlParts.length - 1];
          const publicId = filename.split(".")[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.log("Error deleting old image from Cloudinary:", error);
        }
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "categories",
      });
      imageUrl = result.secure_url;
    }

    category.name = name;
    category.description = description || "";
    if (parentCategory !== undefined) {
      category.parentCategory = parentCategory || null;
    }

    if (imageUrl) {
      category.image = imageUrl;
    }

    category.updateAt = Date.now();

    const updatedCategory = await category.save();

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const hasChildren = await Category.exists({ parentCategory: categoryId });
    if (hasChildren) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category with child categories. Please delete child categories first.",
      });
    }

    if (category.image) {
      try {
        const urlParts = category.image.split("/");
        const filename = urlParts[urlParts.length - 1];
        const publicId = filename.split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.log("Error deleting image from Cloudinary:", error);
      }
    }

    await Category.findByIdAndDelete(categoryId);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const exportAllCategoriesToJson = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    const filePath = path.join(__dirname, "../categories.json");
    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), "utf-8");
    res.status(200).json({
      success: true,
      message: "Exported all categories to categories.json",
      filePath,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting categories",
      error: error.message,
    });
  }
};

module.exports = {
  getChildCategories,
  getParentCategories,
  getAllCategoriesPopular,
  getCategoryChildrenById,
  getAttributesByCategoryId,
  getChildCategoriesByParentId,
  createCategory,
  createChildCategory,
  updateCategory,
  deleteCategory,
  exportAllCategoriesToJson,
};
