const mongoose = require('mongoose');
const productVariantSchema = new mongoose.Schema({});
module.exports = mongoose.model('ProductVariant', productVariantSchema);
