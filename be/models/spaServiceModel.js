const mongoose = require("mongoose");

const spaServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    category: {
      type: String,
      enum: ["spa", "cleaning", "grooming", "coloring"],
      required: true,
    },
    description: { type: String, default: "" },
    petTypes: {
      type: [String],
      enum: ["dog", "cat"],
      default: [],
    },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 1 },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "spaServices",
  }
);

module.exports = mongoose.model("SpaService", spaServiceSchema);
