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
    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports =  mongoose.model("SpaService", spaServiceSchema);
