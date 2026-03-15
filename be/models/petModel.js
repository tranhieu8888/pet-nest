const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["dog", "cat"],
      required: true,
    },
    breed: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["male", "female", "unknown"],
      default: "unknown",
    },
    age: { type: Number, default: null },
    weight: { type: Number, default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pet", petSchema);
