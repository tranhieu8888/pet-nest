const Order = require('../models/order');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// 1. getAdminOrders
const getAdminOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by status if provided
    if (status && status !== 'All') {
      // Assuming 'All' means no status filter
      query.status = status.toLowerCase();
    }
    
    // Search by user name/email or order ID
    if (search) {
      // Remove leading '#' if present (frontend shows IDs like #50798948)
      const cleanSearch = search.replace(/^#/, '').trim();
      const searchRegex = new RegExp(cleanSearch, 'i');
      
      // Find matching users by name or email
      const users = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }]
      }).select('_id');
      
      const userIds = users.map(u => u._id);
      
      const orConditions = [];
      
      if (userIds.length > 0) {
        orConditions.push({ userId: { $in: userIds } });
      }
      
      // If search is a valid full ObjectId, match exactly
      if (mongoose.Types.ObjectId.isValid(cleanSearch) && cleanSearch.length === 24) {
        orConditions.push({ _id: cleanSearch });
      }
      
      // If search looks like a partial hex string (e.g. last 8 chars of ID),
      // find orders whose _id ends with that string
      if (/^[a-fA-F0-9]+$/.test(cleanSearch) && cleanSearch.length < 24) {
        const allMatchingOrders = await Order.find({}).select('_id');
        const matchedIds = allMatchingOrders
          .filter(o => o._id.toString().toLowerCase().endsWith(cleanSearch.toLowerCase()))
          .map(o => o._id);
        
        if (matchedIds.length > 0) {
          orConditions.push({ _id: { $in: matchedIds } });
        }
      }
      
      if (orConditions.length > 0) {
        query.$or = orConditions;
      } else {
        // No matches at all, return empty
        query._id = null;
      }
    }
    
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Count total matching docs
    const totalOrders = await Order.countDocuments(query);
    
    // Fetch paginated docs
    const orders = await Order.find(query)
      .sort({ createAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .populate({
        path: 'userId',
        select: 'name email phone'
      })
      .populate({
        path: 'OrderItems',
        populate: [
          {
            path: 'productId',
            select: 'name'
          },
          {
            path: 'productVariant',
            select: 'images sellPrice attribute'
          }
        ]
      });
      
    res.status(200).json({
      orders,
      totalPages: Math.ceil(totalOrders / limitNumber),
      currentPage: pageNumber,
      totalOrders
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng' });
  }
};

// 2. getAdminOrderById
const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    
    const order = await Order.findById(id)
      .populate('userId', 'name email phone avatar')
      .populate({
        path: 'OrderItems',
        populate: [
          {
            path: 'productId',
            select: 'name'
          },
          {
            path: 'productVariant',
            select: 'images sellPrice attribute',
            populate: {
              path: 'attribute'
            }
          }
        ]
      })
      .populate('voucher');
      
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching admin order by ID:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết đơn hàng' });
  }
};

// 3. updateOrderStatus
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID đơn hàng không hợp lệ' });
    }
    
    const validStatuses = ['processing', 'shipping', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    
    // Status transition validation
    const currentStatus = order.status || 'processing';
    
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      return res.status(400).json({ message: `Không thể thay đổi trạng thái của đơn hàng đã ${currentStatus}` });
    }
    
    if (currentStatus === 'processing') {
      if (status !== 'shipping' && status !== 'cancelled') {
        return res.status(400).json({ message: 'Trạng thái xử lý chỉ có thể chuyển sang giao hàng hoặc hủy' });
      }
    } else if (currentStatus === 'shipping') {
      if (status !== 'completed' && status !== 'cancelled') {
        return res.status(400).json({ message: 'Trạng thái giao hàng chỉ có thể chuyển sang hoàn thành hoặc hủy' });
      }
    }
    
    order.status = status;
    order.updateAt = Date.now();
    await order.save();
    
    res.status(200).json({ message: 'Cập nhật trạng thái thành công', order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái đơn hàng' });
  }
};

module.exports = {
  getAdminOrders,
  getAdminOrderById,
  updateOrderStatus
};
