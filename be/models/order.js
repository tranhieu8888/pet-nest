const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  ward: { type: String },
  district: { type: String },
  province: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String, required: true, default: 'Vietnam' }
}, { _id: true });

const OrderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  OrderManagerId: {
    type: Schema.Types.ObjectId,
    required: false,
    ref: 'User'
  },
  payOSOrderCode: {
    type: Number
  },
  OrderItems: [{
    type: Schema.Types.ObjectId,
    ref: 'OrderItem'
  }],
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['processing', 'shipping', 'completed', 'cancelled'],
    default: 'processing'
  },
  paymentMethod: {
    type: String,
    status: String
  },
  voucher: [{
    type: Schema.Types.ObjectId,
    ref: 'Voucher'
  }],
  address: addressSchema,
  createAt: {
    type: Date,
    default: Date.now
  },
  updateAt: {
    type: Date,
    default: Date.now
  },

});

module.exports = mongoose.model('Order', OrderSchema);
