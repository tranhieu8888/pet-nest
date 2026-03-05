const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Blog = require("../models/blogModel.js");

/* =========================
   SLUGIFY (tiếng Việt)
========================= */
function slugifyVN(str = "") {
  return str
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-zA-Z0-9\s-]/g, "") // bỏ ký tự đặc biệt/emoji
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

// tạo slug unique: nếu trùng thì -1, -2...
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

/* =========================================
   CREATE BLOG (1 image + slug)
========================================= */
exports.createBlog = async (req, res) => {
  try {
    const { title, description, tag } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Thiếu title/description",
      });
    }

    const slug = await generateUniqueSlug(title);

    // 1 ảnh: req.file
    const image = req.file
      ? {
          url: `${req.protocol}://${req.get("host")}/uploads/${
            req.file.filename
          }`,
          public_id: req.file.filename,
        }
      : { url: "", public_id: "" };

    const blog = await Blog.create({
      title,
      slug,
      description,
      tag,
      image,
    });

    res.status(201).json({
      success: true,
      blog,
    });
  } catch (e) {
    console.error("CREATE BLOG ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

/* =========================================
   GET ALL BLOGS
========================================= */
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      blogs,
    });
  } catch (e) {
    console.error("GET ALL BLOG ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

/* =========================================
   GET SINGLE BLOG
========================================= */
exports.getBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    const related = await Blog.find({
      _id: { $ne: blog._id },
      tag: blog.tag,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      blog,
      related,
    });
  } catch (e) {
    console.error("GET BLOG ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

/* =========================================
   UPDATE BLOG (1 image + slug update)
   - Nếu upload ảnh mới -> xoá ảnh cũ và thay
   - Nếu gửi removeImage=true -> xoá ảnh cũ và để trống
   - Nếu không gửi gì -> giữ ảnh cũ
========================================= */
exports.updateBlog = async (req, res) => {
  try {
    const { title, description, tag, removeImage } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Thiếu title/description",
      });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    // update slug nếu title đổi
    if (title !== blog.title) {
      blog.slug = await generateUniqueSlug(title, blog._id);
    }

    // xử lý ảnh
    const hasNewFile = !!req.file;
    const wantRemove = String(removeImage) === "true";

    const deleteLocalFileIfExists = (public_id) => {
      if (!public_id) return;
      const filePath = path.join(__dirname, "../uploads", public_id);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    };

    if (hasNewFile) {
      // xoá ảnh cũ
      deleteLocalFileIfExists(blog.image?.public_id);

      // set ảnh mới
      blog.image = {
        url: `${req.protocol}://${req.get("host")}/uploads/${
          req.file.filename
        }`,
        public_id: req.file.filename,
      };
    } else if (wantRemove) {
      deleteLocalFileIfExists(blog.image?.public_id);
      blog.image = { url: "", public_id: "" };
    }

    blog.title = title;
    blog.description = description;
    blog.tag = tag;

    await blog.save();

    res.json({
      success: true,
      blog,
    });
  } catch (e) {
    console.error("UPDATE BLOG ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

/* =========================================
   DELETE BLOG (xoá 1 ảnh)
========================================= */
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    // XÓA FILE LOCAL
    const publicId = blog.image?.public_id;
    if (publicId) {
      const filePath = path.join(__dirname, "../uploads", publicId);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await blog.deleteOne();

    res.json({
      success: true,
      message: "Deleted",
    });
  } catch (e) {
    console.error("DELETE BLOG ERROR:", e);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
};

// GET BLOG BY SLUG (tăng views + related)
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
    }).sort({ createdAt: -1 });

    res.json({ success: true, blog, related });
  } catch (e) {
    console.error("GET BLOG BY SLUG ERROR:", e);
    res.status(500).json({ success: false, message: e.message });
  }
};
