const Product = require("../models/product");
const ProductVariant = require("../models/productVariant");
const SpaService = require("../models/spaServiceModel");
const Blog = require("../models/blogModel");
const { askCustomerSupport } = require("../services/geminiService");

async function buildKnowledgeContext() {
  const [products, variants, spaServices, blogs] = await Promise.all([
    Product.find({}).select("name brand description").limit(12).lean(),
    ProductVariant.find({}).select("product_id sellPrice").limit(40).lean(),
    SpaService.find({ isDeleted: false, isActive: true })
      .select("name slug category price durationMinutes petTypes")
      .limit(10)
      .lean(),
    Blog.find({}).select("title slug tag").sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const cheapestVariantByProduct = new Map();
  for (const variant of variants) {
    const productId = String(variant.product_id || "");
    if (!productId) continue;

    const price = Number(variant.sellPrice || 0);
    if (!cheapestVariantByProduct.has(productId)) {
      cheapestVariantByProduct.set(productId, price);
      continue;
    }

    const current = cheapestVariantByProduct.get(productId);
    if (price > 0 && (current === 0 || price < current)) {
      cheapestVariantByProduct.set(productId, price);
    }
  }

  const productLines = products.map((p, index) => {
    const productId = String(p._id);
    const price = cheapestVariantByProduct.get(productId);
    const safeDesc = (p.description || "").toString().replace(/\s+/g, " ").slice(0, 120);

    return `${index + 1}. ${p.name || "(không tên)"} | Thương hiệu: ${p.brand || "N/A"} | Giá từ: ${
      typeof price === "number" ? `${price.toLocaleString("vi-VN")}đ` : "chưa có"
    } | Mô tả: ${safeDesc}`;
  });

  const spaLines = spaServices.map((s, index) => {
    const petTypes = Array.isArray(s.petTypes) ? s.petTypes.join(", ") : "";
    return `${index + 1}. ${s.name} | Giá: ${Number(s.price || 0).toLocaleString("vi-VN")}đ | Thời lượng: ${
      s.durationMinutes || 0
    } phút | Thú cưng: ${petTypes || "N/A"} | slug: ${s.slug}`;
  });

  const blogLines = blogs.map((b, index) => `${index + 1}. ${b.title} | tag: ${b.tag || ""} | slug: ${b.slug}`);

  return [
    "[SẢN PHẨM]",
    ...(productLines.length > 0 ? productLines : ["Không có dữ liệu sản phẩm"]),
    "",
    "[DỊCH VỤ SPA]",
    ...(spaLines.length > 0 ? spaLines : ["Không có dữ liệu dịch vụ spa"]),
    "",
    "[BLOG MỚI]",
    ...(blogLines.length > 0 ? blogLines : ["Không có dữ liệu blog"]),
  ].join("\n");
}

exports.chatWithAI = async (req, res) => {
  try {
    const { message, history, pageContext } = req.body || {};

    const cleanMessage = (message || "").toString().trim();

    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập nội dung tin nhắn",
      });
    }

    if (cleanMessage.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Tin nhắn quá dài (tối đa 1000 ký tự)",
      });
    }

    const knowledgeContext = await buildKnowledgeContext();
    const safePageContext = (pageContext || "").toString().slice(0, 250);
    const finalKnowledgeContext = safePageContext
      ? `${knowledgeContext}\n\n[NGỮ CẢNH TRANG HIỆN TẠI]\n${safePageContext}`
      : knowledgeContext;

    const reply = await askCustomerSupport(cleanMessage, history || [], finalKnowledgeContext);

    return res.status(200).json({
      success: true,
      reply: reply || "Xin lỗi, tôi chưa thể phản hồi lúc này. Vui lòng thử lại sau.",
    });
  } catch (error) {
    console.error("AI CHAT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể kết nối AI lúc này",
    });
  }
};
