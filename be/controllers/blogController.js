const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Blog = require("../models/blogModel.js");

/* =========================
   HELPERS
========================= */
function stripHtml(html = "") {
  return html
    .toString()
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidTag(tag = "") {
  const t = tag.toString().trim();
  // "#xx" => ít nhất 2 ký tự sau #
  return /^#[^\s#]{2,}$/.test(t);
}

/* =========================
   SLUGIFY (tiếng Việt)
========================= */
function slugifyVN(str = "") {
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

async function generateUniqueSlug(title, excludeId = null) {
  const base = slugifyVN(title);
  let slug = base || "blog";
  let i = 0;

  while (true) {
    const query = excludeId ? { slug, _id: { $ne: excludeId } } : { slug };
    const exists = await Blog.findOne(query).select("_id");
    if (!exists) return slug;

    i += 1;
    slug = `${base || "blog"}-${i}`;
  }
}

function deleteLocalFileIfExists(public_id) {
  if (!public_id) return;
  const filePath = path.join(__dirname, "../uploads", public_id);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

/* =========================================
   CREATE BLOG (1 image + slug) + VALIDATE
========================================= */
exports.createBlog = async (req, res) => {
  try {
    const { title, description, tag } = req.body;

    const cleanTitle = (title || "").trim();
    const cleanTag = (tag || "").trim();
    const plainDesc = stripHtml(description || "");

    if (!cleanTitle) {
      return res
        .status(400)
        .json({ success: false, message: "Tiêu đề không được để trống" });
    }
    if (cleanTitle.length < 10) {
      return res
        .status(400)
        .json({ success: false, message: "Tiêu đề phải từ 10 ký tự trở lên" });
    }

    if (!plainDesc) {
      return res
        .status(400)
        .json({ success: false, message: "Mô tả không được để trống" });
    }
    if (plainDesc.length < 50) {
      return res
        .status(400)
        .json({ success: false, message: "Mô tả phải từ 50 ký tự trở lên" });
    }

    if (!cleanTag) {
      return res
        .status(400)
        .json({ success: false, message: "Tag không được để trống" });
    }
    if (!isValidTag(cleanTag)) {
      return res.status(400).json({
        success: false,
        message:
          "Tag phải đúng định dạng #xx (ít nhất 2 ký tự sau #, không có khoảng trắng)",
      });
    }

    // create bắt buộc có ảnh
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng upload 1 ảnh" });
    }

    const slug = await generateUniqueSlug(cleanTitle);

    const image = {
      url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
      public_id: req.file.filename,
    };

    const blog = await Blog.create({
      title: cleanTitle,
      slug,
      description, // giữ HTML
      tag: cleanTag,
      image,
    });

    res.status(201).json({ success: true, blog });
  } catch (e) {
    console.error("CREATE BLOG ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/* =========================================
   GET ALL BLOGS
========================================= */
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (e) {
    console.error("GET ALL BLOG ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/* =========================================
   GET SINGLE BLOG (by id)
========================================= */
exports.getBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid blog ID" });
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const related = await Blog.find({
      _id: { $ne: blog._id },
      tag: blog.tag,
    }).sort({
      createdAt: -1,
    });

    res.json({ success: true, blog, related });
  } catch (e) {
    console.error("GET BLOG ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/* =========================================
   UPDATE BLOG (1 image + slug update) + VALIDATE
   - upload ảnh mới => xoá ảnh cũ, thay ảnh
   - removeImage=true => xoá ảnh cũ
   - không gửi gì => giữ ảnh cũ
   - không cho bài viết rơi vào trạng thái "không có ảnh"
========================================= */
exports.updateBlog = async (req, res) => {
  try {
    const { title, description, tag, removeImage } = req.body;

    const cleanTitle = (title || "").trim();
    const cleanTag = (tag || "").trim();
    const plainDesc = stripHtml(description || "");

    if (!cleanTitle) {
      return res
        .status(400)
        .json({ success: false, message: "Tiêu đề không được để trống" });
    }
    if (cleanTitle.length < 10) {
      return res
        .status(400)
        .json({ success: false, message: "Tiêu đề phải từ 10 ký tự trở lên" });
    }

    if (!plainDesc) {
      return res
        .status(400)
        .json({ success: false, message: "Mô tả không được để trống" });
    }
    if (plainDesc.length < 50) {
      return res
        .status(400)
        .json({ success: false, message: "Mô tả phải từ 50 ký tự trở lên" });
    }

    if (!cleanTag) {
      return res
        .status(400)
        .json({ success: false, message: "Tag không được để trống" });
    }
    if (!isValidTag(cleanTag)) {
      return res.status(400).json({
        success: false,
        message:
          "Tag phải đúng định dạng #xx (ít nhất 2 ký tự sau #, không có khoảng trắng)",
      });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    // update slug nếu title đổi
    if (cleanTitle !== blog.title) {
      blog.slug = await generateUniqueSlug(cleanTitle, blog._id);
    }

    const hasNewFile = !!req.file;
    const wantRemove = String(removeImage) === "true";

    // nếu user muốn remove ảnh mà không upload ảnh mới => cấm để rỗng
    if (wantRemove && !hasNewFile) {
      return res.status(400).json({
        success: false,
        message: "Không thể xoá ảnh mà không upload ảnh mới",
      });
    }

    if (hasNewFile) {
      deleteLocalFileIfExists(blog.image?.public_id);
      blog.image = {
        url: `${req.protocol}://${req.get("host")}/uploads/${
          req.file.filename
        }`,
        public_id: req.file.filename,
      };
    } else if (wantRemove) {
      // trường hợp này thực tế không xảy ra vì đã chặn ở trên,
      // nhưng giữ để code rõ ràng
      deleteLocalFileIfExists(blog.image?.public_id);
      blog.image = { url: "", public_id: "" };
    }

    blog.title = cleanTitle;
    blog.description = description; // giữ HTML
    blog.tag = cleanTag;

    await blog.save();

    res.json({ success: true, blog });
  } catch (e) {
    console.error("UPDATE BLOG ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/* =========================================
   DELETE BLOG
========================================= */
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    deleteLocalFileIfExists(blog.image?.public_id);

    await blog.deleteOne();

    res.json({ success: true, message: "Deleted" });
  } catch (e) {
    console.error("DELETE BLOG ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};

/* =========================================
   GET BLOG BY SLUG
========================================= */
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const related = await Blog.find({
      _id: { $ne: blog._id },
      tag: blog.tag,
    }).sort({
      createdAt: -1,
    });

    res.json({ success: true, blog, related });
  } catch (e) {
    console.error("GET BLOG BY SLUG ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};
