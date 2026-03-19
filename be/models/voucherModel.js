const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Mã voucher không được để trống"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: [0, "Phần trăm giảm phải lớn hơn hoặc bằng 0"],
      max: [100, "Phần trăm giảm không được lớn hơn 100"],
    },
    maxDiscountAmount: {
      type: Number,
      required: [true, "Giảm tối đa không được để trống"],
      min: [0, "Giảm tối đa phải lớn hơn hoặc bằng 0"],
    },
    minOrderValue: {
      type: Number,
      required: [true, "Giá trị đơn hàng tối thiểu không được để trống"],
      min: [0, "Giá trị đơn hàng tối thiểu phải lớn hơn hoặc bằng 0"],
    },
    validFrom: {
      type: Date,
      required: [true, "Thời gian bắt đầu không được để trống"],
    },
    validTo: {
      type: Date,
      required: [true, "Thời gian kết thúc không được để trống"],
    },
    usageLimit: {
      type: Number,
      required: [true, "Số lượt sử dụng không được để trống"],
      min: [0, "Số lượt sử dụng phải lớn hơn hoặc bằng 0"],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, "Số lượt đã dùng phải lớn hơn hoặc bằng 0"],
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Voucher = mongoose.model("Voucher", voucherSchema);

module.exports = Voucher;
