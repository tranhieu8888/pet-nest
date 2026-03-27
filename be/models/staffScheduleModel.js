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
      trim: true,
    },

    shiftEnd: {
      type: String,
      default: "",
      trim: true,
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
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "staffSchedules",
  }
);

// Unique chỉ áp dụng với record chưa bị xoá mềm
staffScheduleSchema.index(
  { staffId: 1, workDate: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

staffScheduleSchema.pre("validate", function (next) {
  if (this.isDeleted) {
    return next();
  }

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
