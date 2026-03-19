const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminStaffScheduleController");

// Lấy danh sách
router.get("/", ctrl.getAll);
// Tạo mới
router.post("/", ctrl.create);
// Cập nhật
router.put("/:id", ctrl.update);
// Xoá
router.delete("/:id", ctrl.remove);

module.exports = router;
