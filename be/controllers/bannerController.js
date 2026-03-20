const Banner = require("../models/bannerModel");
const { getImageUrl } = require("../utils/fileHelper");

/**
 * Validates banner input data
 */
const validateBannerInput = async (req, { isUpdate = false, currentBannerId = null } = {}) => {
  const errors = {};
  const { title, description, status, startDate, endDate, link, buttonText } = req.body;

  if (!title?.trim()) errors.title = "Tiêu đề không được để trống";
  if (!description?.trim()) errors.description = "Mô tả không được để trống";
  if (!status) errors.status = "Trạng thái không được để trống";
  else if (!["active", "inactive"].includes(status)) errors.status = "Trạng thái không hợp lệ";

  if (!startDate) errors.startDate = "Ngày bắt đầu không được để trống";
  if (!endDate) errors.endDate = "Ngày kết thúc không được để trống";

  if (!link?.trim()) {
    errors.link = "Link không được để trống";
  } else {
    try { new URL(link); } catch { errors.link = "Link không hợp lệ"; }
  }

  if (!buttonText?.trim()) {
    errors.buttonText = "Text nút không được để trống";
  } else if (buttonText.length < 2) {
    errors.buttonText = "Text nút phải từ 2 ký tự trở lên";
  } else if (buttonText.length > 30) {
    errors.buttonText = "Text nút tối đa 30 ký tự";
  }

  if (!isUpdate && !req.file) errors.image = "Ảnh không được để trống";

  if (startDate && endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (isNaN(start)) errors.startDate = "Ngày bắt đầu không hợp lệ";
    if (isNaN(end)) errors.endDate = "Ngày kết thúc không hợp lệ";
    if (!isNaN(start) && !isNaN(end) && end <= start) errors.endDate = "Ngày kết thúc phải lớn hơn ngày bắt đầu";
  }

  if (title) {
    const duplicatedBanner = await Banner.findOne({
      title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    if (duplicatedBanner && duplicatedBanner._id.toString() !== currentBannerId?.toString()) {
      errors.title = "Tiêu đề đã tồn tại";
    }
  }

  return errors;
};

// POST /api/banners
exports.createBanner = async (req, res) => {
  try {
    const errors = await validateBannerInput(req);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: Object.values(errors)[0], errors });
    }

    const bannerData = {
      ...req.body,
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      imageUrl: getImageUrl(req, req.file.filename),
      link: req.body.link.trim(),
      buttonText: req.body.buttonText.trim(),
    };

    const banner = await Banner.create(bannerData);
    return res.status(201).json(banner);
  } catch (error) {
    console.error("Create Banner Error:", error);
    return res.status(500).json({ message: "Lỗi server khi tạo banner" });
  }
};

// GET /api/banners
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    return res.status(200).json(banners);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi lấy danh sách banner" });
  }
};

// GET /api/banners/:id
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner không tồn tại" });
    return res.status(200).json(banner);
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi lấy chi tiết banner" });
  }
};

// PUT /api/banners/:id
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner không tồn tại" });

    const errors = await validateBannerInput(req, { isUpdate: true, currentBannerId: banner._id });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: Object.values(errors)[0], errors });
    }

    const updateData = {
      ...req.body,
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      link: req.body.link.trim(),
      buttonText: req.body.buttonText.trim(),
    };

    if (req.file) {
      updateData.imageUrl = getImageUrl(req, req.file.filename);
    }

    const updatedBanner = await Banner.findByIdAndUpdate(req.params.id, updateData, { new: true });
    return res.status(200).json(updatedBanner);
  } catch (error) {
    console.error("Update Banner Error:", error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật banner" });
  }
};

// DELETE /api/banners/:id
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner không tồn tại" });
    return res.status(200).json({ message: "Xóa banner thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server khi xóa banner" });
  }
};
