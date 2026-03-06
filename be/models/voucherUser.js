const mongoose = require("mongoose");

const voucherUserSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "voucherUser",
  }
);

const VoucherUser = mongoose.model("VoucherUser", voucherUserSchema);
module.exports = VoucherUser;
