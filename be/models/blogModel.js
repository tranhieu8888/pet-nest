const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },
    tag: { type: String, default: "" },

    image: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },

    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);
