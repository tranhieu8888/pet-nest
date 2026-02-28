const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tag: { type: String, default: "" },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true }, // ✅ QUAN TRỌNG
      },
    ],
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Blog", BlogSchema);
