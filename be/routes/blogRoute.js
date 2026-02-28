const express = require("express");
const router = express.Router();
const { upload } = require("../config/upload.js");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");
const { ROLES } = require("../config/role");

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

// CREATE blog (chỉ admin)
router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  upload.array("images", 5),
  createBlog
);

// UPDATE blog (chỉ admin)
router.put(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  upload.array("images", 5),
  updateBlog
);

// DELETE blog (chỉ admin)
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.ADMIN),
  deleteBlog
);

module.exports = router;
