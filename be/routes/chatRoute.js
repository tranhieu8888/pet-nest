const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorization');
const { ROLES } = require('../config/role');
const chatController = require('../controllers/chatController');

router.use(verifyToken);

router.get('/staffs', authorizeRoles(ROLES.CUSTOMER, ROLES.STAFF), chatController.getStaffList);
router.get('/conversations', authorizeRoles(ROLES.CUSTOMER, ROLES.STAFF), chatController.getConversations);
router.post('/conversations', authorizeRoles(ROLES.CUSTOMER, ROLES.STAFF), chatController.getOrCreateConversation);
router.get('/conversations/:conversationId/messages', authorizeRoles(ROLES.CUSTOMER, ROLES.STAFF), chatController.getMessages);
router.post('/conversations/:conversationId/messages', authorizeRoles(ROLES.CUSTOMER, ROLES.STAFF), chatController.sendMessage);
router.patch('/conversations/:conversationId/read', authorizeRoles(ROLES.CUSTOMER, ROLES.STAFF), chatController.markConversationRead);

module.exports = router;
