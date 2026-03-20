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

    rejectedByStaffIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
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
      allergies: { type: String, default: "" },
      behaviorNote: { type: String, default: "" },
      image: { type: String, default: "" },
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

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },

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

    checkedInAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    checkedOutAt: { type: Date, default: null },

    note: { type: String, default: "" },
    internalNote: { type: String, default: "" },

    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: "" },

    // PayOS Integration
    payOSOrderCode: { type: Number, unique: true, sparse: true },
    payOSPaymentLink: { type: String, default: "" },
    payOSStatus: { type: String, default: "PENDING" },
  },
  {
    timestamps: true,
    collection: "spaBookings",
  }
);

spaBookingSchema.index({ customerId: 1, createdAt: -1 });
spaBookingSchema.index({ staffId: 1, startAt: 1 });
spaBookingSchema.index({ startAt: 1, endAt: 1, status: 1 });

module.exports = mongoose.model("SpaBooking", spaBookingSchema);
