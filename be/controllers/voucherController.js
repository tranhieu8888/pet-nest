const Voucher = require("../models/voucherModel");
const VoucherUser = require("../models/voucherUserModal"); // getVouchersByUserId

const normalizeCode = (code = "") => String(code).trim().toUpperCase();

const buildDeletedCode = (code) => {
  return `${normalizeCode(code)}__DELETED__${Date.now()}`;
};

const validateVoucherPayload = async ({
  code,
  discountAmount,
  discountPercent,
  minOrderValue,
  validFrom,
  validTo,
  usageLimit,
  excludeId = null,
  isUpdateUsedVoucher = false,
  usedCount = 0,
}) => {
  const errors = {};

  if (!isUpdateUsedVoucher) {
    if (!String(code || "").trim()) {
      errors.code = "Mã voucher không được để trống";
    } else {
      const normalizedCode = normalizeCode(code);
      const existingVoucher = await Voucher.findOne({
        code: normalizedCode,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      });

      if (existingVoucher) {
        errors.code = "Mã voucher đã tồn tại";
      }
    }

    if (
      minOrderValue === "" ||
      minOrderValue === undefined ||
      minOrderValue === null
    ) {
      errors.minOrderValue = "Giá trị đơn hàng tối thiểu không được để trống";
    } else if (
      Number(minOrderValue) < 0 ||
      Number.isNaN(Number(minOrderValue))
    ) {
      errors.minOrderValue =
        "Giá trị đơn hàng tối thiểu phải là số lớn hơn hoặc bằng 0";
    }

    if (
      discountAmount === "" ||
      discountAmount === undefined ||
      discountAmount === null
    ) {
      errors.discountAmount = "Số tiền giảm không được để trống";
    }

    if (
      discountPercent === "" ||
      discountPercent === undefined ||
      discountPercent === null
    ) {
      errors.discountPercent = "Phần trăm giảm không được để trống";
    }

    const amount = Number(discountAmount);
    const percent = Number(discountPercent);

    if (Number.isNaN(amount) || amount < 0) {
      errors.discountAmount = "Số tiền giảm phải là số lớn hơn hoặc bằng 0";
    }

    if (Number.isNaN(percent) || percent < 0) {
      errors.discountPercent = "Phần trăm giảm phải là số lớn hơn hoặc bằng 0";
    } else if (percent > 100) {
      errors.discountPercent = "Phần trăm giảm không được lớn hơn 100";
    }

    const hasAmount = amount > 0;
    const hasPercent = percent > 0;

    if (!hasAmount && !hasPercent) {
      errors.discountType = "Phải nhập số tiền giảm hoặc phần trăm giảm";
    }

    if (hasAmount && hasPercent) {
      errors.discountType = "Chỉ được chọn một loại giảm giá";
    }
  }

  if (!validFrom && !isUpdateUsedVoucher) {
    errors.validFrom = "Thời gian bắt đầu không được để trống";
  }

  if (!validTo) {
    errors.validTo = "Thời gian kết thúc không được để trống";
  }

  if (!isUpdateUsedVoucher && validFrom && validTo) {
    const start = new Date(validFrom);
    const end = new Date(validTo);
    if (start >= end) {
      errors.validTo = "Thời gian kết thúc phải lớn hơn thời gian bắt đầu";
    }
  }

  if (usageLimit === "" || usageLimit === undefined || usageLimit === null) {
    errors.usageLimit = "Số lượt sử dụng không được để trống";
  } else if (Number(usageLimit) < 0 || Number.isNaN(Number(usageLimit))) {
    errors.usageLimit = "Số lượt sử dụng phải là số lớn hơn hoặc bằng 0";
  } else if (Number(usageLimit) < Number(usedCount || 0)) {
    errors.usageLimit = `Số lượt sử dụng phải lớn hơn hoặc bằng ${usedCount}`;
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
      minOrderValue,
      validFrom,
      validTo,
      usageLimit,
    } = req.body;

    const errors = await validateVoucherPayload({
      code,
      discountAmount,
      discountPercent,
      minOrderValue,
      validFrom,
      validTo,
      usageLimit,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const amount = Number(discountAmount);
    const percent = Number(discountPercent);

    const voucher = new Voucher({
      code: normalizeCode(code),
      discountAmount: amount > 0 ? amount : 0,
      discountPercent: percent > 0 ? percent : 0,
      minOrderValue: Number(minOrderValue),
      validFrom,
      validTo,
      usageLimit: Number(usageLimit),
      usedCount: 0,
      isDelete: false,
    });

    const savedVoucher = await voucher.save();
    res.status(201).json(savedVoucher);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        errors: { code: "Mã voucher đã tồn tại" },
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Lấy danh sách tất cả voucher chưa xóa
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({ isDelete: false }).sort({
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
      minOrderValue,
      validFrom,
      validTo,
      usageLimit,
    } = req.body;

    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }

    const isUsed = Number(voucher.usedCount || 0) > 0;

    if (isUsed) {
      const errors = await validateVoucherPayload({
        code: voucher.code,
        discountAmount: voucher.discountAmount,
        discountPercent: voucher.discountPercent,
        minOrderValue: voucher.minOrderValue,
        validFrom: voucher.validFrom,
        validTo,
        usageLimit,
        excludeId: voucher._id,
        isUpdateUsedVoucher: true,
        usedCount: voucher.usedCount,
      });

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ errors });
      }

      voucher.validTo = validTo ?? voucher.validTo;
      voucher.usageLimit = Number(usageLimit);

      const updatedVoucher = await voucher.save();
      return res.status(200).json(updatedVoucher);
    }

    const errors = await validateVoucherPayload({
      code,
      discountAmount,
      discountPercent,
      minOrderValue,
      validFrom,
      validTo,
      usageLimit,
      excludeId: voucher._id,
      usedCount: voucher.usedCount,
    });

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const amount = Number(discountAmount);
    const percent = Number(discountPercent);

    voucher.code = normalizeCode(code);
    voucher.discountAmount = amount > 0 ? amount : 0;
    voucher.discountPercent = percent > 0 ? percent : 0;
    voucher.minOrderValue = Number(minOrderValue);
    voucher.validFrom = validFrom;
    voucher.validTo = validTo;
    voucher.usageLimit = Number(usageLimit);

    const updatedVoucher = await voucher.save();
    res.status(200).json(updatedVoucher);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        errors: { code: "Mã voucher đã tồn tại" },
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

    if (Number(voucher.usedCount || 0) === 0) {
      await voucher.deleteOne();
      return res.status(200).json({ message: "Đã xóa voucher thành công" });
    }

    voucher.isDelete = true;
    voucher.code = buildDeletedCode(voucher.code);
    await voucher.save();

    return res.status(200).json({
      message: "Voucher đã được xóa mềm do đã có lượt sử dụng",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Kiểm tra và áp dụng voucher
const validateVoucher = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const voucher = await Voucher.findOne({
      code: normalizeCode(code),
      isDelete: false,
    });

    if (!voucher) {
      return res.status(404).json({ message: "Mã voucher không tồn tại" });
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

    if (
      orderValue !== undefined &&
      Number(orderValue) < Number(voucher.minOrderValue || 0)
    ) {
      return res.status(400).json({
        message: `Đơn hàng chưa đạt giá trị tối thiểu ${voucher.minOrderValue}`,
      });
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

// Lấy danh sách voucher theo userId
const getVouchersByUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const vouchers = await VoucherUser.find({ userId }).populate({
      path: "voucherId",
      match: { isDelete: false },
    });

    const filtered = vouchers.filter((item) => item.voucherId);
    res.status(200).json(filtered);
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
