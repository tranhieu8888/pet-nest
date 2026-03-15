const mongoose = require("mongoose");

const spaBookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    petId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpaService",
      required: true,
    },

    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    customerSnapshot: {
      name: { type: String, required: true },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },

    petSnapshot: {
      name: { type: String, required: true },
      type: { type: String, enum: ["dog", "cat"], required: true },
      breed: { type: String, default: "" },
      age: { type: Number, default: null },
      weight: { type: Number, default: null },
      note: { type: String, default: "" },
    },

    serviceSnapshot: {
      name: { type: String, required: true },
      category: { type: String, required: true },
      price: { type: Number, required: true },
      durationMinutes: { type: Number, required: true },
    },

    staffSnapshot: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },

    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SpaBooking", spaBookingSchema);
