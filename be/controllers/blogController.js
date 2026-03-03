const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Blog = require("../models/blogModel.js");

/* =========================================
   CREATE BLOG
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

    const images = (req.files || []).map((f) => ({
      url: `${req.protocol}://${req.get("host")}/uploads/${f.filename}`,
      public_id: f.filename,
    }));

    const blog = await Blog.create({
      title,
      description,
      tag,
      images,
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
   UPDATE BLOG
========================================= */
exports.updateBlog = async (req, res) => {
  try {
    const { title, description, tag } = req.body;
    const keepImages = req.body.keepImages;

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

    const keepIds = Array.isArray(keepImages)
      ? keepImages
      : keepImages
      ? [keepImages]
      : [];

    const kept = blog.images.filter((img) => keepIds.includes(img.public_id));

    const uploaded = (req.files || []).map((f) => ({
      url: `${req.protocol}://${req.get("host")}/uploads/${f.filename}`,
      public_id: f.filename,
    }));

    const removed = blog.images.filter(
      (img) => !keepIds.includes(img.public_id)
    );

    // XÓA FILE LOCAL
    for (const img of removed) {
      const filePath = path.join(__dirname, "../uploads", img.public_id);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const nextImagesMap = new Map();
    [...kept, ...uploaded].forEach((img) =>
      nextImagesMap.set(img.public_id, img)
    );

    blog.title = title;
    blog.description = description;
    blog.tag = tag;
    blog.images = Array.from(nextImagesMap.values());

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
   DELETE BLOG
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
    for (const img of blog.images) {
      const filePath = path.join(__dirname, "../uploads", img.public_id);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
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
