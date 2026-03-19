const mongoose = require("mongoose");

function isValidTimeFormat(value) {
  if (!value) return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

const staffScheduleSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    workDate: {
      type: Date,
      required: true,
    },

    shiftStart: {
      type: String,
      default: "",
      validate: {
        validator: function (value) {
          if (this.isOff) return true;
          return isValidTimeFormat(value);
        },
        message: "Giờ bắt đầu không hợp lệ",
      },
    },

    shiftEnd: {
      type: String,
      default: "",
      validate: {
        validator: function (value) {
          if (this.isOff) return true;
          return isValidTimeFormat(value);
        },
        message: "Giờ kết thúc không hợp lệ",
      },
    },

    isOff: {
      type: Boolean,
      default: false,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "staffSchedules",
  }
);

staffScheduleSchema.index({ staffId: 1, workDate: 1 }, { unique: true });

staffScheduleSchema.pre("validate", function (next) {
  if (this.isOff) {
    this.shiftStart = "";
    this.shiftEnd = "";
    return next();
  }

  if (!this.shiftStart || !this.shiftEnd) {
    return next(new Error("Vui lòng nhập giờ bắt đầu và giờ kết thúc"));
  }

  if (
    !isValidTimeFormat(this.shiftStart) ||
    !isValidTimeFormat(this.shiftEnd)
  ) {
    return next(new Error("Giờ làm việc không đúng định dạng HH:mm"));
  }

  if (this.shiftStart >= this.shiftEnd) {
    return next(new Error("Giờ bắt đầu phải nhỏ hơn giờ kết thúc"));
  }

  next();
});

module.exports = mongoose.model("StaffSchedule", staffScheduleSchema);
