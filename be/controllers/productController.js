const mongoose = require("mongoose");
const Product = require("../models/product");
const ProductVariant = require("../models/productVariant");
const ImportBatch = require("../models/import_batches");
const Order = require("../models/order");
const Review = require("../models/reviewModel");
const Category = require("../models/category");
const Attribute = require('../models/attribute');
const OrderItem = require('../models/orderItem');
const User = require('../models/userModel');
const { cloudinary } = require('../config/cloudinary');

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

// ─── Controller Functions ───────────────────────────────────────────────────

// Lấy chi tiết sản phẩm theo Category (Giữ nguyên từ Controller cũ)
const getProductDetailsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (!mongoose.isValidObjectId(categoryId)) {
      return res.status(400).json({ success: false, message: "Invalid categoryId" });
    }

    const objectCategoryId = new mongoose.Types.ObjectId(categoryId);
    const products = await Product.find({ category: objectCategoryId }).lean();
    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({ product_id: { $in: productIds } }).lean();
    const variantIds = variants.map((v) => v._id);

    const { importMap, soldMap } = await getVariantStock(variantIds);

    variants.forEach((variant) => {
      const imported = importMap[variant._id.toString()] || 0;
      const ordered = soldMap[variant._id.toString()] || 0;
      variant.importedQuantity = imported;
      variant.orderedQuantity = ordered;
      variant.availableQuantity = imported - ordered;
    });

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
          user: r.userId ? { _id: r.userId._id, name: r.userId.name, avatar: r.userId.avatar } : null,
        });
      });
    } catch (err) {
      console.warn("Could not fetch reviews:", err.message);
    }

    const result = productsWithVariants.map((product) => {
      const productReviews = reviewMap[product._id.toString()] || [];
      const averageRating = productReviews.length > 0 
        ? productReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / productReviews.length 
        : 0;
      return {
        ...product,
        averageRating,
        totalReviews: productReviews.length,
        reviews: productReviews,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error getting product details by category", error: error.message });
  }
};

// Lấy top 5 sản phẩm bán chạy nhất (Hoặc 5 sản phẩm mới nhất nếu chưa có đơn hàng)
const getTopSellingProducts = async (req, res) => {
    try {
        const topProducts = await Order.aggregate([
            { $unwind: '$OrderItems' },
            {
                $lookup: {
                    from: 'orderitems',
                    localField: 'OrderItems',
                    foreignField: '_id',
                    as: 'orderItemDetails'
                }
            },
            { $unwind: '$orderItemDetails' },
            {
                $group: {
                    _id: '$orderItemDetails.productId',
                    totalSold: { $sum: '$orderItemDetails.quantity' }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $lookup: {
                    from: 'productvariants',
                    localField: '_id',
                    foreignField: 'product_id',
                    as: 'variants'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: '$productDetails.name',
                    description: '$productDetails.description',
                    brand: '$productDetails.brand',
                    totalSold: 1,
                    minSellPrice: { $min: '$variants.sellPrice' },
                    images: {
                        $reduce: {
                            input: '$variants.images',
                            initialValue: [],
                            in: { $concatArrays: ['$$value', '$$this'] }
                        }
                    }
                }
            }
        ]);

        if (topProducts.length === 0) {
            const recentProducts = await Product.aggregate([
                { $sort: { createdAt: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'productvariants',
                        localField: '_id',
                        foreignField: 'product_id',
                        as: 'variants'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        description: 1,
                        brand: 1,
                        totalSold: { $literal: 0 },
                        minSellPrice: { $min: '$variants.sellPrice' },
                        images: {
                            $reduce: {
                                input: '$variants.images',
                                initialValue: [],
                                in: { $concatArrays: ['$$value', '$$this'] }
                            }
                        }
                    }
                }
            ]);
            return res.status(200).json({ success: true, data: recentProducts });
        }

        res.status(200).json({ success: true, data: topProducts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error getting top selling products', error: error.message });
    }
};

// Tìm kiếm sản phẩm
const getProductsBySearch = async (req, res) => {
    try {
        const { search } = req.params;
        if (!search || search.trim() === "") {
            return res.status(400).json({ success: false, message: "Search term is required" });
        }
        const products = await Product.find({ name: { $regex: search, $options: "i" } })
            .populate('category', 'name description parentCategory')
            .lean();

        const productIds = products.map(p => p._id);
        const variants = await ProductVariant.find({ product_id: { $in: productIds } }).lean();
        const variantIds = variants.map(v => v._id);

        const { importMap, soldMap } = await getVariantStock(variantIds);

        const variantsWithStock = variants.map(variant => ({
            ...variant,
            importedQuantity: importMap[variant._id.toString()] || 0,
            orderedQuantity: soldMap[variant._id.toString()] || 0,
            availableQuantity: (importMap[variant._id.toString()] || 0) - (soldMap[variant._id.toString()] || 0)
        }));

        const reviews = await Review.find({ productId: { $in: productIds } })
            .populate('userId', 'name avatar')
            .lean();

        const productMap = {};
        products.forEach(p => { productMap[p._id.toString()] = { ...p, variants: [], reviews: [] }; });
        variantsWithStock.forEach(v => { if (productMap[v.product_id.toString()]) productMap[v.product_id.toString()].variants.push(v); });
        reviews.forEach(r => { if (productMap[r.productId.toString()]) productMap[r.productId.toString()].reviews.push(r); });

        res.status(200).json({ success: true, data: Object.values(productMap) });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error searching products', error: error.message });
    }
};

// Lấy sản phẩm theo ID (Giữ nguyên từ Controller cũ)
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const variants = await ProductVariant.find({ product_id: product._id }).lean();
    const variantIds = variants.map((v) => v._id);
    const { importMap, soldMap } = await getVariantStock(variantIds);

    const variantsWithStock = variants.map((v) => ({
      ...v,
      importedQuantity: importMap[v._id.toString()] || 0,
      orderedQuantity: soldMap[v._id.toString()] || 0,
      availableQuantity: (importMap[v._id.toString()] || 0) - (soldMap[v._id.toString()] || 0),
    }));

    const categoryIds = Array.isArray(product.category) ? product.category : [product.category].filter(Boolean);
    const categoryInfo = await Category.find({ _id: { $in: categoryIds } }).lean();

    const reviews = await Review.find({ productId: product._id }).populate("userId", "name avatar").lean();
    const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;

    res.status(200).json({
      success: true,
      data: {
        ...product,
        category: categoryInfo,
        variants: variantsWithStock,
        averageRating,
        totalReviews: reviews.length,
        reviews: reviews
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error getting product", error: error.message });
  }
};

// Tạo sản phẩm mới
const createProduct = async (req, res) => {
    try {
        const { name, description, brand, categories } = req.body;
        if (!name || !description || !categories || categories.length === 0) {
            return res.status(400).json({ success: false, message: 'Name, description and at least one category are required' });
        }

        const categoryArray = [];
        for (const cat of categories) {
            const categoryDoc = await Category.findById(cat.categoryId);
            if (categoryDoc && !categoryArray.includes(categoryDoc._id)) {
                categoryArray.push(categoryDoc._id);
            }
        }

        const product = new Product({ name, description, brand: brand || '', category: categoryArray });
        await product.save();
        
        const populatedProduct = await Product.findById(product._id)
            .populate({ path: 'category', select: 'name description', populate: { path: 'parentCategory', select: 'name' } });

        res.status(201).json({ success: true, message: 'Product created successfully', data: populatedProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating product', error: error.message });
    }
};

// Lấy tất cả sản phẩm
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category', 'name description').exec();
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

// ─── PRODUCT MANAGEMENT ──────────────────────────────────────────────────────

// Cập nhật thông tin sản phẩm
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, brand, categories } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: 'ID sản phẩm không hợp lệ' });
        }

        const categoryArray = [];
        if (categories && categories.length > 0) {
            for (const cat of categories) {
                if (cat.categoryId) categoryArray.push(cat.categoryId);
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { 
                name, 
                description, 
                brand, 
                category: categoryArray.length > 0 ? categoryArray : undefined 
            },
            { new: true }
        ).populate('category', 'name');

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        res.status(200).json({ success: true, message: 'Cập nhật sản phẩm thành công', data: updatedProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật sản phẩm', error: error.message });
    }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }
        // Xóa tất cả biến thể liên quan
        await ProductVariant.deleteMany({ product_id: id });
        res.status(200).json({ success: true, message: 'Xóa sản phẩm và các biến thể thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm', error: error.message });
    }
};

// ─── VARIANT MANAGEMENT ──────────────────────────────────────────────────────

// Lấy danh sách biến thể theo ID sản phẩm
const getProductVariantsByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        const variants = await ProductVariant.find({ product_id: productId });
        res.status(200).json({ success: true, data: variants });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy biến thể', error: error.message });
    }
};

// Tạo biến thể mới
const createProductVariant = async (req, res) => {
    try {
        const { product_id, attribute, sellPrice, images } = req.body;
        const newVariant = new ProductVariant({ product_id, attribute, sellPrice, images });
        await newVariant.save();
        res.status(201).json({ success: true, message: 'Tạo biến thể thành công', data: newVariant });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi tạo biến thể', error: error.message });
    }
};

// Cập nhật biến thể
const updateProductVariant = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedVariant = await ProductVariant.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json({ success: true, message: 'Cập nhật biến thể thành công', data: updatedVariant });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật biến thể', error: error.message });
    }
};

// Xóa biến thể
const deleteProductVariant = async (req, res) => {
    try {
        const { id } = req.params;
        await ProductVariant.findByIdAndDelete(id);
        // Xóa các lô hàng liên quan đến biến thể này
        await ImportBatch.deleteMany({ variantId: id });
        res.status(200).json({ success: true, message: 'Xóa biến thể thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa biến thể', error: error.message });
    }
};

// ─── IMPORT BATCH MANAGEMENT ────────────────────────────────────────────────

// Tạo lô hàng nhập mới
const createImportBatch = async (req, res) => {
    try {
        const { variantId, quantity, costPrice, importDate } = req.body;
        const newBatch = new ImportBatch({ variantId, quantity, costPrice, importDate: importDate || Date.now() });
        await newBatch.save();
        res.status(201).json({ success: true, message: 'Nhập hàng thành công', data: newBatch });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi nhập hàng', error: error.message });
    }
};

// Lấy lịch sử nhập hàng của một biến thể
const getImportBatchesByVariantId = async (req, res) => {
    try {
        const { variantId } = req.params;
        const batches = await ImportBatch.find({ variantId }).sort({ importDate: -1 });
        res.status(200).json({ success: true, data: batches });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy lịch sử nhập hàng', error: error.message });
    }
};

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

module.exports = {
    getTopSellingProducts,
    getProductById,
    getProductsBySearch,
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct,
    getProductVariantsByProductId,
    createProductVariant,
    updateProductVariant,
    deleteProductVariant,
    createImportBatch,
    getImportBatchesByVariantId
};