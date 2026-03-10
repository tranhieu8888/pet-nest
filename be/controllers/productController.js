const mongoose = require("mongoose");
const Product = require("../models/product");
const ProductVariant = require("../models/productVariant");
const ImportBatch = require("../models/import_batches");
const Order = require("../models/order");
const Review = require("../models/reviewModel");
const Category = require("../models/category");

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getVariantStock = async (variantIds) => {
  let importMap = {};
  let soldMap = {};

  try {
    const importAgg = await ImportBatch.aggregate([
      { $match: { variantId: { $in: variantIds } } },
      {
        $group: { _id: "$variantId", importedQuantity: { $sum: "$quantity" } },
      },
    ]);
    importMap = importAgg.reduce((map, item) => {
      map[item._id.toString()] = item.importedQuantity;
      return map;
    }, {});
  } catch (error) {
    console.warn("Could not calculate import stock", error.message);
  }

  try {
    const soldAgg = await Order.aggregate([
      { $match: { status: { $in: ["processing", "completed", "shipping"] } } },
      { $unwind: "$OrderItems" },
      {
        $lookup: {
          from: "orderitems",
          localField: "OrderItems",
          foreignField: "_id",
          as: "orderItemDetail",
        },
      },
      { $unwind: "$orderItemDetail" },
      { $match: { "orderItemDetail.productVariant": { $in: variantIds } } },
      {
        $group: {
          _id: "$orderItemDetail.productVariant",
          orderedQuantity: { $sum: "$orderItemDetail.quantity" },
        },
      },
    ]);
    soldMap = soldAgg.reduce((map, item) => {
      map[item._id.toString()] = item.orderedQuantity;
      return map;
    }, {});
  } catch (error) {
    console.warn("Could not calculate sold stock", error.message);
  }

  return { importMap, soldMap };
};

// ─── GET /products/productDetailsByCategory/:categoryId ──────────────────────
const getProductDetailsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.isValidObjectId(categoryId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid categoryId" });
    }

    const objectCategoryId = new mongoose.Types.ObjectId(categoryId);

    // 1. Lấy tất cả sản phẩm trong category
    const products = await Product.find({ category: objectCategoryId }).lean();
    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({
      product_id: { $in: productIds },
    }).lean();
    const variantIds = variants.map((v) => v._id);

    // 2. Tính tồn kho cho các variant
    const { importMap, soldMap } = await getVariantStock(variantIds);

    // 3. Gắn availableQuantity vào từng variant
    variants.forEach((variant) => {
      const imported = importMap[variant._id.toString()] || 0;
      const ordered = soldMap[variant._id.toString()] || 0;
      variant.importedQuantity = imported;
      variant.orderedQuantity = ordered;
      variant.availableQuantity = imported - ordered;
    });

    // 5. Gắn variants vào từng product
    const productsWithVariants = products.map((product) => {
      const productVariants = variants
        .filter((v) => v.product_id.toString() === product._id.toString())
        .map((v) => ({
          _id: v._id,
          images: v.images,
          sellPrice: v.sellPrice,
          importedQuantity: v.importedQuantity,
          orderedQuantity: v.orderedQuantity,
          availableQuantity: v.availableQuantity,
          attribute: v.attribute,
        }));
      return { ...product, variants: productVariants };
    });

    // 5. Lấy reviews cho từng product
    let reviewMap = {};
    try {
      const reviews = await Review.find({ productId: { $in: productIds } })
        .populate("userId", "name avatar")
        .lean();
      reviews.forEach((r) => {
        if (!reviewMap[r.productId]) reviewMap[r.productId] = [];
        reviewMap[r.productId].push({
          _id: r._id,
          rating: r.rating,
          comment: r.comment,
          images: r.images,
          createdAt: r.createdAt,
          user: r.userId
            ? {
              _id: r.userId._id,
              name: r.userId.name,
              avatar: r.userId.avatar,
            }
            : null,
        });
      });
    } catch (err) {
      console.warn("Could not fetch reviews:", err.message);
    }

    // 7. Format kết quả
    const result = productsWithVariants.map((product) => {
      const productReviews = reviewMap[product._id.toString()] || [];
      const averageRating =
        productReviews.length > 0
          ? productReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          productReviews.length
          : 0;
      return {
        _id: product._id,
        name: product.name,
        description: product.description,
        brand: product.brand,
        category: product.category,
        createAt: product.createAt,
        updateAt: product.updateAt,
        variants: product.variants,
        averageRating,
        totalReviews: productReviews.length,
        reviews: productReviews,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting product details by category",
      error: error.message,
    });
  }
};

// ─── GET /products/best-selling ──────────────────────────────────────────────
const getBestSellingProducts = async (req, res) => {
  try {
    const sales = await Order.aggregate([
      { $match: { status: { $in: ["completed", "shipping", "processing"] } } },
      { $unwind: "$OrderItems" },
      {
        $lookup: {
          from: "orderitems",
          localField: "OrderItems",
          foreignField: "_id",
          as: "orderItemDetail",
        },
      },
      { $unwind: "$orderItemDetail" },
      {
        $group: {
          _id: "$orderItemDetail.productId",
          totalSold: { $sum: "$orderItemDetail.quantity" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    const topProductIds = sales.map((s) => s._id).filter(Boolean);
    const query =
      topProductIds.length > 0 ? { _id: { $in: topProductIds } } : {};
    const products = await Product.find(query).limit(5).lean();
    const variants = await ProductVariant.find({
      product_id: { $in: products.map((p) => p._id) },
    }).lean();

    const result = products.map((product) => ({
      ...product,
      variants: variants.filter(
        (v) => v.product_id.toString() === product._id.toString(),
      ),
      totalSold:
        sales.find((s) => s._id?.toString() === product._id.toString())
          ?.totalSold || 0,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting best selling products",
      error: error.message,
    });
  }
};

// ─── GET /products/productById/:id ──────────────────────────────────────────
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const variants = await ProductVariant.find({
      product_id: product._id,
    }).lean();
    const variantIds = variants.map((v) => v._id);

    // Mượn helper tính stock
    const { importMap, soldMap } = await getVariantStock(variantIds);

    const variantsWithStock = variants.map((v) => ({
      _id: v._id,
      images: v.images,
      sellPrice: v.sellPrice,
      attribute: v.attribute,
      importedQuantity: importMap[v._id.toString()] || 0,
      orderedQuantity: soldMap[v._id.toString()] || 0,
      availableQuantity:
        (importMap[v._id.toString()] || 0) - (soldMap[v._id.toString()] || 0),
    }));

    // Lấy Category info
    const categoryIds = Array.isArray(product.category)
      ? product.category
      : [product.category].filter(Boolean);
    const categoryInfo = await Category.find({
      _id: { $in: categoryIds },
    }).lean();

    // Lấy Reviews
    let reviews = [];
    try {
      reviews = await Review.find({ productId: product._id })
        .populate("userId", "name avatar")
        .lean();
    } catch (err) {
      console.warn("Could not fetch reviews for product", err.message);
    }

    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        _id: product._id,
        name: product.name,
        description: product.description,
        brand: product.brand,
        category: categoryInfo,
        createAt: product.createAt,
        updateAt: product.updateAt,
        variants: variantsWithStock,
        averageRating,
        totalReviews: reviews.length,
        reviews: reviews.map((r) => ({
          _id: r._id,
          rating: r.rating,
          comment: r.comment,
          images: r.images,
          createdAt: r.createdAt,
          userId: r.userId,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting product",
      error: error.message,
    });
  }
};

module.exports = {
  getProductDetailsByCategory,
  getBestSellingProducts,
  getProductById,
};