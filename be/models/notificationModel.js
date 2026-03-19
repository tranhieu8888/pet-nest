const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
