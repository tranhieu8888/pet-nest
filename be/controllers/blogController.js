const mongoose = require('mongoose');

const Blog = require('../models/blogModel.js');
const { cloudinary } = require('../config/cloudinary.js');

// Create new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, description, tag } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu title/description" });
    }

    const images = (req.files || []).map((f) => ({
      url: f.path,
      public_id: f.filename, // ✅ LƯU LUÔN
    }));

    const blog = await Blog.create({ title, description, tag, images });

    res.status(201).json({ success: true, blog });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Get single blog
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!blog)
      return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, blog });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const { title, description, tag } = req.body;
    const keepImages = req.body.keepImages;
    // keepImages có thể là string hoặc array

    if (!title || !description) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu title/description" });
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog)
      return res.status(404).json({ success: false, message: "Not found" });

    const keepIds = Array.isArray(keepImages)
      ? keepImages
      : keepImages
      ? [keepImages]
      : [];

    // ✅ ảnh được giữ lại
    const kept = blog.images.filter((img) => keepIds.includes(img.public_id));

    // ✅ ảnh mới upload
    const uploaded = (req.files || []).map((f) => ({
      url: f.path,
      public_id: f.filename,
    }));

    // ✅ ảnh bị xoá = ảnh cũ - ảnh kept
    const removed = blog.images.filter(
      (img) => !keepIds.includes(img.public_id)
    );

    // ✅ xoá cloudinary theo public_id (chuẩn)
    for (const img of removed) {
      try {
        await cloudinary.uploader.destroy(img.public_id);
      } catch (err) {
        console.error("Cloudinary delete fail:", err);
      }
    }

    // ✅ không bao giờ trùng public_id
    const nextImagesMap = new Map();
    [...kept, ...uploaded].forEach((img) =>
      nextImagesMap.set(img.public_id, img)
    );
    const nextImages = Array.from(nextImagesMap.values());

    blog.title = title;
    blog.description = description;
    blog.tag = tag;
    blog.images = nextImages;

    await blog.save();

    res.json({ success: true, blog });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog)
      return res.status(404).json({ success: false, message: "Not found" });

    for (const img of blog.images) {
      try {
        await cloudinary.uploader.destroy(img.public_id);
      } catch (err) {
        console.error("Cloudinary delete fail:", err);
      }
    }

    await blog.deleteOne();

    res.json({ success: true, message: "Deleted" });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
