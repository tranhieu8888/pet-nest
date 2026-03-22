const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lastMessage: {
      type: String,
      default: '',
      trim: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadByCustomer: {
      type: Number,
      default: 0,
    },
    unreadByStaff: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ customerId: 1, staffId: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
