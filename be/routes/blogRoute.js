const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary.js");

const {
  createBlog,
  getAllBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
} = require("../controllers/blogController.js");

// GET all blogs
router.get("/", getAllBlogs);

// GET blog by id
router.get("/:id", getBlog);

// CREATE blog
router.post("/", upload.array("images", 5), createBlog);

// UPDATE blog
router.put("/:id", upload.array("images", 5), updateBlog);

// DELETE blog
router.delete("/:id", deleteBlog);

module.exports = router;
