const mongoose = require("mongoose");

const voucherUserSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 0,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const VoucherUser = mongoose.model("VoucherUser", voucherUserSchema);

module.exports = VoucherUser;
