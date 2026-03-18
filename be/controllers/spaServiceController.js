const mongoose = require("mongoose");
const SpaService = require("../models/spaServiceModel");

// GET ALL ACTIVE SPA SERVICES
exports.getAllSpaServices = async (req, res) => {
  try {
    const spaServices = await SpaService.find({ isActive: true }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: spaServices,
    });
  } catch (e) {
    console.error("GET ALL SPA SERVICES ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy danh sách dịch vụ spa",
    });
  }
};

// GET SPA SERVICE BY ID
exports.getSpaServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID dịch vụ không hợp lệ",
      });
    }

    const spaService = await SpaService.findOne({
      _id: id,
      isActive: true,
    });

    if (!spaService) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ spa",
      });
    }

    return res.status(200).json({
      success: true,
      data: spaService,
    });
  } catch (e) {
    console.error("GET SPA SERVICE BY ID ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy chi tiết dịch vụ spa",
    });
  }
};

// GET SPA SERVICE BY SLUG
exports.getSpaServiceBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const spaService = await SpaService.findOne({
      slug,
      isActive: true,
    });

    if (!spaService) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ spa",
      });
    }

    return res.status(200).json({
      success: true,
      data: spaService,
    });
  } catch (e) {
    console.error("GET SPA SERVICE BY SLUG ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy chi tiết dịch vụ spa",
    });
  }
};
