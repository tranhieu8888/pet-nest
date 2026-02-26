const mongoose = require('mongoose');
const voucherSchema = new mongoose.Schema({});
module.exports = mongoose.model('Voucher', voucherSchema);
