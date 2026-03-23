const Order = require('../models/order');
const OrderItem = require('../models/orderItem');
const Cart = require('../models/cart');
const CartItem = require('../models/cartItem');
const ProductVariant = require('../models/productVariant');
const User = require('../models/userModel');
const payOSService = require('../services/payOSService');
const mongoose = require('mongoose');

exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItemIds, address, paymentMethod, phone, voucherCode } = req.body;

        if (!cartItemIds || !cartItemIds.length || !address || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt hàng.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
        }

        // Cập nhật số điện thoại nếu chưa có
        if (phone && !user.phone) {
            user.phone = phone;
            await user.save();
        }

        // Tạo address object
        const orderAddress = {
            street: address.street || '',
            ward: address.ward || '',
            district: address.district || '',
            province: address.province || '',
            city: address.province || address.city || 'N/A',
            state: address.state || '',
            postalCode: address.postalCode || '',
            country: 'Vietnam'
        };

        // Lưu địa chỉ vào profile nếu người dùng chưa có địa chỉ nào
        if (!user.address || user.address.length === 0) {
            user.address = [orderAddress];
            await user.save();
        }

        // Lấy danh sách cart items
        const cartItems = await CartItem.find({ _id: { $in: cartItemIds } }).populate('productVariantId');
        if (cartItems.length === 0) {
            return res.status(400).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng.' });
        }

        let total = 0;
        const newOrderItems = [];

        // Tạo order items và tính tổng
        for (const item of cartItems) {
            const variant = item.productVariantId;
            if (!variant) continue;

            const price = variant.sellPrice || 0;
            total += price * item.quantity;

            const orderItem = new OrderItem({
                productId: item.productId,
                productVariant: variant._id,
                quantity: item.quantity,
                price: price
            });
            await orderItem.save();
            newOrderItems.push(orderItem._id);
        }

        const shippingFee = address && (address.province || address.district || address.ward || address.street) ? 30000 : 0;
        
        let discount = 0;
        let voucherDoc = null;

        if (voucherCode) {
            const Voucher = require('../models/voucherModel');
            voucherDoc = await Voucher.findOne({ code: String(voucherCode).trim().toUpperCase(), isDelete: false });
            
            if (!voucherDoc) {
                return res.status(400).json({ success: false, message: 'Mã voucher không tồn tại.' });
            }

            const now = new Date();
            if (now < voucherDoc.validFrom || now > voucherDoc.validTo) {
                return res.status(400).json({ success: false, message: 'Voucher đã hết hạn hoặc chưa đến thời gian sử dụng.' });
            }

            if (voucherDoc.usageLimit > 0 && voucherDoc.usedCount >= voucherDoc.usageLimit) {
                return res.status(400).json({ success: false, message: 'Voucher đã hết lượt sử dụng.' });
            }

            if (total < (voucherDoc.minOrderValue || 0)) {
                return res.status(400).json({ success: false, message: `Đơn hàng chưa đạt giá trị tối thiểu ${voucherDoc.minOrderValue}đ để sử dụng voucher này.` });
            }

            const rawDiscount = (total * (voucherDoc.discountPercent || 0)) / 100;
            discount = Math.min(rawDiscount, (voucherDoc.maxDiscountAmount || 0));

            // Tăng số lượt sử dụng voucher
            voucherDoc.usedCount += 1;
            await voucherDoc.save();
        }

        const finalTotal = Math.max(0, total + shippingFee - discount);
        const orderCode = Date.now();

        const order = new Order({
            userId,
            OrderItems: newOrderItems,
            total: finalTotal,
            address: orderAddress,
            paymentMethod,
            status: 'processing',
            payOSOrderCode: orderCode,
            voucher: voucherDoc ? [voucherDoc._id] : undefined
        });

        await order.save();

        // Xóa giỏ hàng
        const cart = await Cart.findOne({ userId });
        if (cart) {
            cart.cartItems = cart.cartItems.filter(id => !cartItemIds.includes(id.toString()));
            await cart.save();
        }
        await CartItem.deleteMany({ _id: { $in: cartItemIds } });

        // Nếu thanh toán qua PayOS
        if (paymentMethod === 'payos') {
            const YOUR_DOMAIN = process.env.BASE_URL || 'http://localhost:3000';
            const checkoutData = {
                orderCode: orderCode,
                amount: finalTotal,
                description: `Thanh toan SP ${order._id.toString().substring(0, 6)}`,
                returnUrl: `${YOUR_DOMAIN}/order-success?orderId=${order._id}`,
                cancelUrl: `${YOUR_DOMAIN}/checkout?payment=cancelled`
            };

            const paymentLinkData = await payOSService.createPaymentLink(checkoutData);

            if (paymentLinkData) {
                return res.status(200).json({
                    success: true,
                    message: 'Khởi tạo link thanh toán thành công',
                    data: order,
                    checkoutUrl: paymentLinkData.checkoutUrl
                });
            } else {
                return res.status(500).json({ success: false, message: 'Không thể khởi tạo thanh toán PayOS' });
            }
        }

        // Nếu COD
        return res.status(200).json({
            success: true,
            message: 'Đặt hàng thành công',
            data: order
        });

    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate({
                path: 'OrderItems',
                populate: [
                    { path: 'productId', select: 'name images' },
                    { path: 'productVariant', select: 'sellPrice attributes images' }
                ]
            });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Đơn hàng không tồn tại' });
        }

        // Kiểm tra quyền
        if (order.userId.toString() !== req.user.id && req.user.role !== 0) {
            return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng này' });
        }

        return res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
