const express = require('express');
const router = express.Router();
const adminOrderController = require('../controllers/adminOrderController');
const verifyToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorization');
const { ROLES } = require('../config/role');

router.use(verifyToken);
router.use(authorizeRoles(ROLES.ADMIN));

router.get('/', adminOrderController.getAdminOrders);
router.get('/:id', adminOrderController.getAdminOrderById);
router.patch('/:id/status', adminOrderController.updateOrderStatus);

module.exports = router;
