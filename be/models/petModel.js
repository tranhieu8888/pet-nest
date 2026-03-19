const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Tên thú cưng là bắt buộc"],
      trim: true,
    },

    type: {
      type: String,
      enum: {
        values: ["dog", "cat"],
        message: "Loại thú cưng không hợp lệ",
      },
      required: [true, "Loại thú cưng là bắt buộc"],
    },

    breed: {
      type: String,
      required: [true, "Giống là bắt buộc"],
      trim: true,
    },

    gender: {
      type: String,
      enum: {
        values: ["male", "female", "unknown"],
        message: "Giới tính không hợp lệ",
      },
      required: [true, "Giới tính là bắt buộc"],
      default: "unknown",
    },

    age: {
      type: Number,
      required: [true, "Tuổi là bắt buộc"],
      min: [0, "Tuổi không được nhỏ hơn 0"],
    },

    weight: {
      type: Number,
      required: [true, "Cân nặng là bắt buộc"],
      min: [0, "Cân nặng không được nhỏ hơn 0"],
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    allergies: {
      type: String,
      default: "",
      trim: true,
    },

    behaviorNote: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Chặn trường hợp nhập toàn dấu cách
petSchema.path("name").validate(function (value) {
  return typeof value === "string" && value.trim().length > 0;
}, "Tên thú cưng không được để trống");

petSchema.path("breed").validate(function (value) {
  return typeof value === "string" && value.trim().length > 0;
}, "Giống không được để trống");

module.exports = mongoose.model("Pet", petSchema);
