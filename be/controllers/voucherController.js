const Voucher = require("../models/voucherModel");
const VoucherUser = require("../models/voucherUserModel");

const normalizeCode = (code) =>
  String(code || "")
    .trim()
    .toUpperCase();

const validateVoucherInput = ({
  code,
  discountAmount,
  discountPercent,
  validFrom,
  validTo,
  usageLimit,
}) => {
  const errors = {};

  if (!String(code || "").trim()) {
    errors.code = "Mã voucher không được để trống";
  }

  if (!validFrom) {
    errors.validFrom = "Thời gian bắt đầu không được để trống";
  }

  if (!validTo) {
    errors.validTo = "Thời gian kết thúc không được để trống";
  }

  if (usageLimit === "" || usageLimit === null || usageLimit === undefined) {
    errors.usageLimit = "Số lượt sử dụng không được để trống";
  } else if (Number(usageLimit) < 0 || Number.isNaN(Number(usageLimit))) {
    errors.usageLimit = "Số lượt sử dụng phải là số dương hoặc bằng 0";
  }

  const amount = Number(discountAmount || 0);
  const percent = Number(discountPercent || 0);

  if (percent > 0) {
    if (percent < 0 || Number.isNaN(percent)) {
      errors.discountPercent = "Phần trăm giảm phải là số dương hoặc bằng 0";
    }
    if (percent > 100) {
      errors.discountPercent = "Phần trăm giảm không được lớn hơn 100";
    }
  } else {
    if (
      discountAmount === "" ||
      discountAmount === null ||
      discountAmount === undefined
    ) {
      errors.discountAmount = "Số tiền giảm không được để trống";
    } else if (amount < 0 || Number.isNaN(amount)) {
      errors.discountAmount = "Số tiền giảm phải là số dương hoặc bằng 0";
    }
  }

  if (validFrom && validTo) {
    const start = new Date(validFrom);
    const end = new Date(validTo);

    if (isNaN(start.getTime())) {
      errors.validFrom = "Thời gian bắt đầu không hợp lệ";
    }

    if (isNaN(end.getTime())) {
      errors.validTo = "Thời gian kết thúc không hợp lệ";
    }

    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start >= end) {
      errors.validTo = "Thời gian kết thúc phải lớn hơn thời gian bắt đầu";
    }
  }

  return errors;
};

// Tạo voucher mới
const createVoucher = async (req, res) => {
  try {
    const {
      code,
      discountAmount,
      discountPercent,
      validFrom,
      validTo,
      usageLimit,
      minOrderValue,
    } = req.body;

    const normalizedCode = normalizeCode(code);

    const errors = validateVoucherInput({
      code: normalizedCode,
      discountAmount,
      discountPercent,
      validFrom,
      validTo,
      usageLimit,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ", errors });
    }

    const existingVoucher = await Voucher.findOne({ code: normalizedCode });
    if (existingVoucher) {
      return res.status(400).json({
        message: "Mã voucher đã tồn tại",
        errors: {
          code: "Mã voucher đã tồn tại",
        },
      });
    }

    let finalDiscountAmount = 0;
    let finalDiscountPercent = 0;

    if (Number(discountPercent) > 0) {
      finalDiscountPercent = Number(discountPercent);
    } else {
      finalDiscountAmount = Number(discountAmount);
    }

    const voucher = new Voucher({
      code: normalizedCode,
      discountAmount: finalDiscountAmount,
      discountPercent: finalDiscountPercent,
      validFrom,
      validTo,
      usageLimit: Number(usageLimit),
      usedCount: 0,
      minOrderValue: Number(minOrderValue || 0),
      isActive: true,
    });

    const savedVoucher = await voucher.save();
    res.status(201).json(savedVoucher);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Mã voucher đã tồn tại",
        errors: {
          code: "Mã voucher đã tồn tại",
        },
      });
    }

    res.status(400).json({ message: error.message });
  }
};

// Lấy danh sách tất cả voucher
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({ isActive: true }).sort({
      createdAt: -1,
    });
    res.status(200).json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy thông tin một voucher theo ID
const getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }
    res.status(200).json(voucher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật thông tin voucher
const updateVoucher = async (req, res) => {
  try {
    const {
      code,
      discountAmount,
      discountPercent,
      validFrom,
      validTo,
      usageLimit,
      isActive,
      minOrderValue,
    } = req.body;

    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }

    const hasBeenUsed = Number(voucher.usedCount || 0) > 0;

    if (!hasBeenUsed) {
      const normalizedCode = normalizeCode(code);

      const errors = validateVoucherInput({
        code: normalizedCode,
        discountAmount,
        discountPercent,
        validFrom,
        validTo,
        usageLimit,
      });

      if (Object.keys(errors).length > 0) {
        return res
          .status(400)
          .json({ message: "Dữ liệu không hợp lệ", errors });
      }

      const existingVoucher = await Voucher.findOne({
        code: normalizedCode,
        _id: { $ne: req.params.id },
      });

      if (existingVoucher) {
        return res.status(400).json({
          message: "Mã voucher đã tồn tại",
          errors: {
            code: "Mã voucher đã tồn tại",
          },
        });
      }

      voucher.code = normalizedCode;
      voucher.validFrom = validFrom;
      voucher.validTo = validTo;
      voucher.usageLimit = Number(usageLimit);
      voucher.minOrderValue = Number(minOrderValue || 0);

      if (typeof isActive === "boolean") {
        voucher.isActive = isActive;
      }

      if (Number(discountPercent) > 0) {
        voucher.discountPercent = Number(discountPercent);
        voucher.discountAmount = 0;
      } else {
        voucher.discountAmount = Number(discountAmount);
        voucher.discountPercent = 0;
      }
    } else {
      const errors = {};

      if (!validTo) {
        errors.validTo = "Thời gian kết thúc không được để trống";
      } else {
        const oldStart = new Date(voucher.validFrom);
        const newEnd = new Date(validTo);

        if (isNaN(newEnd.getTime())) {
          errors.validTo = "Thời gian kết thúc không hợp lệ";
        } else if (oldStart >= newEnd) {
          errors.validTo = "Thời gian kết thúc phải lớn hơn thời gian bắt đầu";
        }
      }

      if (
        usageLimit === "" ||
        usageLimit === null ||
        usageLimit === undefined
      ) {
        errors.usageLimit = "Số lượt sử dụng không được để trống";
      } else if (
        Number(usageLimit) < Number(voucher.usedCount || 0) ||
        Number.isNaN(Number(usageLimit))
      ) {
        errors.usageLimit = `Số lượt sử dụng phải lớn hơn hoặc bằng ${voucher.usedCount}`;
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          message:
            "Voucher đã được sử dụng, chỉ được sửa ngày kết thúc, số lượt dùng và trạng thái hoạt động",
          errors,
        });
      }

      voucher.validTo = validTo;
      voucher.usageLimit = Number(usageLimit);

      if (typeof isActive === "boolean") {
        voucher.isActive = isActive;
      }
    }

    const updatedVoucher = await voucher.save();
    res.status(200).json(updatedVoucher);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Mã voucher đã tồn tại",
        errors: {
          code: "Mã voucher đã tồn tại",
        },
      });
    }

    res.status(400).json({ message: error.message });
  }
};

// Xóa voucher
const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);

    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }

    if (voucher.usedCount > 0) {
      return res.status(400).json({
        message:
          "Không thể xóa voucher đã dùng. Bạn có thể tắt kích hoạt voucher.",
      });
    }

    await voucher.deleteOne();

    res.status(200).json({
      message: "Đã xóa voucher thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kiểm tra và áp dụng voucher
const validateVoucher = async (req, res) => {
  try {
    const { code } = req.body;
    const normalizedCode = normalizeCode(code);
    const voucher = await Voucher.findOne({ code: normalizedCode });

    if (!voucher) {
      return res.status(404).json({ message: "Mã voucher không tồn tại" });
    }

    if (!voucher.isActive) {
      return res
        .status(400)
        .json({ message: "Voucher hiện đang ngừng hoạt động" });
    }

    const now = new Date();
    if (now < voucher.validFrom || now > voucher.validTo) {
      return res.status(400).json({
        message: "Voucher đã hết hạn hoặc chưa đến thời gian sử dụng",
      });
    }

    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ message: "Voucher đã hết lượt sử dụng" });
    }

    res.status(200).json({
      message: "Voucher hợp lệ",
      voucher: {
        id: voucher._id,
        code: voucher.code,
        discountAmount: voucher.discountAmount,
        discountPercent: voucher.discountPercent,
        minOrderValue: voucher.minOrderValue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy danh sách voucher theo userId, voucher bị ẩn ko thấy
const getVouchersByUserId = async (req, res) => {
  try {
    const userId = req.user.id;

    const vouchers = await VoucherUser.find({ userId }).populate({
      path: "voucherId",
      match: { isActive: true },
    });

    const filteredVouchers = vouchers.filter((item) => item.voucherId);

    res.status(200).json(filteredVouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVoucher,
  getAllVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  validateVoucher,
  getVouchersByUserId,
};
