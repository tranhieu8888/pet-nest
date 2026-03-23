const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    cartItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CartItem'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);
