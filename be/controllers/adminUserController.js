const User = require("../models/userModel");
const { ROLES } = require("../config/role");

// Lấy danh sách user theo role
exports.getAll = async (req, res) => {
  try {
    let filter = {};

    if (req.query.role === "STAFF" || req.query.role === "2") {
      filter = { role: ROLES.STAFF };
    }

    const users = await User.find(filter).select("_id name").sort({ name: 1 });

    res.json(users);
  } catch (e) {
    res.status(500).json({ message: e.message || "Lỗi server" });
  }
};
