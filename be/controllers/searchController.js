const Product = require("../models/product");
const SpaService = require("../models/spaServiceModel");
const Category = require("../models/category");

function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.searchSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q) {
      return res.status(200).json({
        success: true,
        data: {
          products: [],
          spaServices: [],
        },
      });
    }

    const keyword = escapeRegex(q);
    const regex = new RegExp(keyword, "i");

    // tìm category khớp tên để hỗ trợ product theo category name
    const matchedCategories = await Category.find({
      name: regex,
    }).select("_id name");

    const matchedCategoryIds = matchedCategories.map((c) => c._id);

    const [products, spaServices] = await Promise.all([
      Product.find({
        $or: [
          { name: regex },
          { brand: regex },
          { description: regex },
          ...(matchedCategoryIds.length > 0
            ? [{ category: { $in: matchedCategoryIds } }]
            : []),
        ],
      })
        .populate("category", "name")
        .limit(8)
        .lean(),

      SpaService.find({
        isDeleted: false,
        isActive: true,
        $or: [
          { name: regex },
          { slug: regex },
          { description: regex },
          { category: regex },
        ],
      })
        .limit(8)
        .lean(),
    ]);

    const formattedProducts = products.map((item) => ({
      _id: item._id,
      type: "product",
      name: item.name,
      brand: item.brand || "",
      description: item.description || "",
      categories: Array.isArray(item.category)
        ? item.category.map((c) => c?.name).filter(Boolean)
        : [],
      // sửa URL này theo route chi tiết sản phẩm của bạn nếu khác
      url: `/product/${item._id}`,
    }));

    const formattedSpaServices = spaServices.map((item) => ({
      _id: item._id,
      type: "spaService",
      name: item.name,
      slug: item.slug,
      category: item.category,
      description: item.description || "",
      url: `/spa-services/${item.slug}`,
    }));

    return res.status(200).json({
      success: true,
      data: {
        products: formattedProducts,
        spaServices: formattedSpaServices,
      },
    });
  } catch (error) {
    console.error("searchSuggestions error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi tìm kiếm gợi ý",
    });
  }
};
