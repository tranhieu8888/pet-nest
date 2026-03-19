const mongoose = require("mongoose");

const spaServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
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

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },

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

spaServiceSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
  }
);

module.exports = mongoose.model("SpaService", spaServiceSchema);
