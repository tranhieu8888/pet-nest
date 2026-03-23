const mongoose = require('mongoose');
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const User = require('../models/userModel');
const { ROLES } = require('../config/role');

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

function hasRole(userRole, role) {
  if (userRole === ROLES.ADMIN) return true;
  return (userRole & role) !== 0;
}

async function buildConversationResponse(conversation, currentUserId, userRole) {
  const customer = conversation.customerId;
  const staff = conversation.staffId;

  const isStaffViewer = hasRole(userRole, ROLES.STAFF);
  const isCustomerViewer =
    customer && typeof customer === 'object' && customer._id
      ? customer._id.toString() === currentUserId
      : conversation.customerId?.toString?.() === currentUserId;

  const partner = isStaffViewer ? customer : isCustomerViewer ? staff : customer || staff;

  return {
    _id: conversation._id,
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: isStaffViewer ? conversation.unreadByStaff : conversation.unreadByCustomer,
    partner: {
      _id: partner?._id || null,
      name: partner?.name || 'Người dùng',
      email: partner?.email || '',
      avatar: partner?.avatar || '',
      role: partner?.role,
    },
  };
}

exports.getStaffList = async (req, res) => {
  try {
    const staffs = await User.find({
      $or: [{ role: ROLES.STAFF }, { role: { $bitsAllSet: ROLES.STAFF } }],
    })
      .select('_id name email avatar role')
      .sort({ name: 1 });

    return res.status(200).json({ success: true, data: staffs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const query = hasRole(userRole, ROLES.STAFF)
      ? {}
      : { customerId: userId };

    const conversations = await Conversation.find(query)
      .populate('customerId', '_id name email phone avatar role')
      .populate('staffId', '_id name email phone avatar role')
      .sort({ lastMessageAt: -1 });

    const data = await Promise.all(conversations.map((c) => buildConversationResponse(c, userId, userRole)));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

exports.getOrCreateConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentRole = req.user.role;
    const { customerId, staffId } = req.body;

    if (!customerId || !staffId) {
      return res.status(400).json({ success: false, message: 'Thiếu customerId hoặc staffId' });
    }

    if (!mongoose.isValidObjectId(customerId) || !mongoose.isValidObjectId(staffId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ' });
    }

    if (!hasRole(currentRole, ROLES.STAFF) && customerId !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền tạo hội thoại này' });
    }


    const [customer, staff] = await Promise.all([
      User.findById(customerId).select('_id role'),
      User.findById(staffId).select('_id role'),
    ]);

    if (!customer || !staff) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }

    let conversation = await Conversation.findOne({ customerId, staffId });

    if (!conversation) {
      conversation = await Conversation.create({
        customerId: toObjectId(customerId),
        staffId: toObjectId(staffId),
        lastMessage: '',
        lastMessageAt: new Date(),
      });
    }

    return res.status(200).json({ success: true, data: conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ success: false, message: 'conversationId không hợp lệ' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hội thoại' });
    }

    const isCustomer = conversation.customerId.toString() === userId;
    const isAssignedStaff = conversation.staffId.toString() === userId;
    const canAccessAsStaff = hasRole(req.user.role, ROLES.STAFF);

    if (!isCustomer && !isAssignedStaff && !canAccessAsStaff) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập hội thoại này' });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', '_id name email avatar role')
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hội thoại' });
    }

    const isCustomerSender = conversation.customerId.toString() === userId;
    const isAssignedStaffSender = conversation.staffId.toString() === userId;
    const isStaffSender = hasRole(req.user.role, ROLES.STAFF);

    if (!isCustomerSender && !isAssignedStaffSender && !isStaffSender) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền gửi tin nhắn ở hội thoại này' });
    }

    const message = await Message.create({
      conversationId: toObjectId(conversationId),
      senderId: toObjectId(userId),
      text: text.trim(),
      isRead: false,
    });

    conversation.lastMessage = message.text;
    conversation.lastMessageAt = new Date();

    if (isCustomerSender) {
      conversation.unreadByStaff += 1;
    } else {
      conversation.unreadByCustomer += 1;
    }

    await conversation.save();

    const populated = await Message.findById(message._id).populate('senderId', '_id name email avatar role');

    if (req.io && populated) {
      if (isCustomerSender) {
        req.io.to('staff-care').emit('newMessage', {
          conversationId,
          message: populated,
        });
      } else {
        req.io.to(conversation.customerId.toString()).emit('newMessage', {
          conversationId,
          message: populated,
        });
      }
    }

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};

exports.markConversationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hội thoại' });
    }

    const isCustomer = conversation.customerId.toString() === userId;
    const isAssignedStaff = conversation.staffId.toString() === userId;
    const isStaff = hasRole(req.user.role, ROLES.STAFF);

    if (!isCustomer && !isAssignedStaff && !isStaff) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật hội thoại này' });
    }

    await Message.updateMany(
      { conversationId, senderId: { $ne: userId }, isRead: false },
      { $set: { isRead: true } }
    );

    if (isCustomer) {
      conversation.unreadByCustomer = 0;
    } else {
      conversation.unreadByStaff = 0;
    }

    await conversation.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Lỗi server' });
  }
};
