const mongoose = require('mongoose');
const orderItemSchema = new mongoose.Schema({});
module.exports = mongoose.model('OrderItem', orderItemSchema);
