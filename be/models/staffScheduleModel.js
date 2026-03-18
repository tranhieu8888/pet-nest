const mongoose = require("mongoose");

const staffScheduleSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    workDate: { type: Date, required: true },
    shiftStart: { type: String, required: true }, // "08:00"
    shiftEnd: { type: String, required: true }, // "17:00"

    isOff: { type: Boolean, default: false },
    note: { type: String, default: "" },
  },
  {
    timestamps: true,
    collection: "staffSchedules",
  }
);

staffScheduleSchema.index({ staffId: 1, workDate: 1 }, { unique: true });

module.exports = mongoose.model("StaffSchedule", staffScheduleSchema);
