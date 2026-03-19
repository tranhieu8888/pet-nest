const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const SpaService = require("../models/spaServiceModel");

const ALLOWED_CATEGORIES = ["spa", "cleaning", "grooming", "coloring"];
const ALLOWED_PET_TYPES = ["dog", "cat"];

function normalizeSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function normalizeUploadPath(filePath = "") {
  const normalized = String(filePath).replace(/\\/g, "/");
  const uploadsIndex = normalized.lastIndexOf("/uploads/");

  if (uploadsIndex !== -1) {
    return normalized.substring(uploadsIndex);
  }

  return "/" + normalized.replace(/^\/+/, "");
}

function removeUploadedFile(filePath) {
  try {
    if (!filePath) return;

    const normalized = String(filePath).replace(/\\/g, "/");

    let absolutePath = normalized;

    if (!path.isAbsolute(normalized)) {
      absolutePath = path.join(__dirname, "..", normalized.replace(/^\/+/, ""));
    }

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (error) {
    console.error("REMOVE FILE ERROR:", error);
  }
}

function validateSpaServicePayload(body) {
  const name = String(body.name || "").trim();
  const slug = normalizeSlug(body.slug || body.name || "");
  const category = String(body.category || "").trim();
  const description = String(body.description || "").trim();

  let petTypes = body.petTypes || [];
  if (typeof petTypes === "string") {
    try {
      petTypes = JSON.parse(petTypes);
    } catch {
      petTypes = [petTypes];
    }
  }

  if (!Array.isArray(petTypes)) {
    petTypes = [];
  }

  const normalizedPetTypes = [
    ...new Set(
      petTypes.map((item) => String(item).trim().toLowerCase()).filter(Boolean)
    ),
  ];

  const price = Number(body.price);
  const durationMinutes = Number(body.durationMinutes);

  const isActive =
    typeof body.isActive === "boolean"
      ? body.isActive
      : String(body.isActive) === "false"
      ? false
      : true;

  if (!name) {
    return { error: "Tên dịch vụ không được để trống" };
  }

  if (!slug) {
    return { error: "Slug không được để trống" };
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    return { error: "Danh mục dịch vụ không hợp lệ" };
  }

  if (normalizedPetTypes.length === 0) {
    return { error: "Vui lòng chọn ít nhất một loại thú cưng" };
  }

  const invalidPetType = normalizedPetTypes.some(
    (item) => !ALLOWED_PET_TYPES.includes(item)
  );

  if (invalidPetType) {
    return { error: "Loại thú cưng không hợp lệ" };
  }

  if (Number.isNaN(price) || price < 0) {
    return { error: "Giá dịch vụ không hợp lệ" };
  }

  if (Number.isNaN(durationMinutes) || durationMinutes < 1) {
    return { error: "Thời lượng dịch vụ phải lớn hơn 0" };
  }

  return {
    value: {
      name,
      slug,
      category,
      description,
      petTypes: normalizedPetTypes,
      price,
      durationMinutes,
      isActive,
    },
  };
}

// GET ALL + SEARCH + PAGINATION
exports.getAllSpaServices = async (req, res) => {
  try {
    const page =
      parseInt(req.query.page, 10) > 0 ? parseInt(req.query.page, 10) : 1;
    const limit =
      parseInt(req.query.limit, 10) > 0 ? parseInt(req.query.limit, 10) : 10;
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();
    const isActive = req.query.isActive;

    const skip = (page - 1) * limit;

    const filter = {
      isDeleted: false,
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { slug: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { petTypes: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (category && ALLOWED_CATEGORIES.includes(category)) {
      filter.category = category;
    }

    if (isActive === "true") {
      filter.isActive = true;
    } else if (isActive === "false") {
      filter.isActive = false;
    }

    const total = await SpaService.countDocuments(filter);

    const services = await SpaService.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: services,
      total,
      page,
      limit,
    });
  } catch (e) {
    console.error("ADMIN GET ALL SPA SERVICES ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy danh sách dịch vụ spa",
    });
  }
};

// GET BY ID
exports.getSpaServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID dịch vụ không hợp lệ",
      });
    }

    const service = await SpaService.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ spa",
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (e) {
    console.error("ADMIN GET SPA SERVICE BY ID ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi lấy chi tiết dịch vụ spa",
    });
  }
};

// CREATE
exports.createSpaService = async (req, res) => {
  try {
    const { error, value } = validateSpaServicePayload(req.body);

    if (error) {
      if (req.file?.path) {
        removeUploadedFile(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const existingSlug = await SpaService.findOne({
      slug: value.slug,
      isDeleted: false,
    });

    if (existingSlug) {
      if (req.file?.path) {
        removeUploadedFile(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: "Slug đã tồn tại, vui lòng chọn slug khác",
      });
    }

    const adminId = req.user?.id || req.user?._id || req.user?.userId || null;
    const imagePath = req.file ? normalizeUploadPath(req.file.path) : "";

    const createdService = await SpaService.create({
      ...value,
      image: imagePath,
      createdBy: adminId,
      updatedBy: adminId,
    });

    return res.status(201).json({
      success: true,
      message: "Tạo dịch vụ spa thành công",
      data: createdService,
    });
  } catch (e) {
    console.error("ADMIN CREATE SPA SERVICE ERROR:", e);

    if (req.file?.path) {
      removeUploadedFile(req.file.path);
    }

    if (e?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Slug đã tồn tại, vui lòng chọn slug khác",
      });
    }

    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi tạo dịch vụ spa",
    });
  }
};

// UPDATE
exports.updateSpaService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file?.path) {
        removeUploadedFile(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: "ID dịch vụ không hợp lệ",
      });
    }

    const { error, value } = validateSpaServicePayload(req.body);

    if (error) {
      if (req.file?.path) {
        removeUploadedFile(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const existingService = await SpaService.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existingService) {
      if (req.file?.path) {
        removeUploadedFile(req.file.path);
      }

      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ spa",
      });
    }

    const duplicateSlug = await SpaService.findOne({
      slug: value.slug,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (duplicateSlug) {
      if (req.file?.path) {
        removeUploadedFile(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: "Slug đã tồn tại, vui lòng chọn slug khác",
      });
    }

    const adminId = req.user?.id || req.user?._id || req.user?.userId || null;
    const oldImage = existingService.image || "";

    existingService.name = value.name;
    existingService.slug = value.slug;
    existingService.category = value.category;
    existingService.description = value.description;
    existingService.petTypes = value.petTypes;
    existingService.price = value.price;
    existingService.durationMinutes = value.durationMinutes;
    existingService.isActive = value.isActive;
    existingService.updatedBy = adminId;

    if (req.file?.path) {
      existingService.image = normalizeUploadPath(req.file.path);
    }

    await existingService.save();

    if (req.file?.path && oldImage && oldImage !== existingService.image) {
      removeUploadedFile(oldImage);
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật dịch vụ spa thành công",
      data: existingService,
    });
  } catch (e) {
    console.error("ADMIN UPDATE SPA SERVICE ERROR:", e);

    if (req.file?.path) {
      removeUploadedFile(req.file.path);
    }

    if (e?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Slug đã tồn tại, vui lòng chọn slug khác",
      });
    }

    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi cập nhật dịch vụ spa",
    });
  }
};

// SOFT DELETE
exports.deleteSpaService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID dịch vụ không hợp lệ",
      });
    }

    const service = await SpaService.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ spa",
      });
    }

    service.isDeleted = true;
    service.deletedAt = new Date();
    service.isActive = false;

    await service.save();

    return res.status(200).json({
      success: true,
      message: "Xóa dịch vụ spa thành công",
      data: service,
    });
  } catch (e) {
    console.error("ADMIN DELETE SPA SERVICE ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e.message || "Lỗi server khi xóa dịch vụ spa",
    });
  }
};
