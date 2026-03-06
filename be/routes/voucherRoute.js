const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const verifyToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorization');

const { ROLES } = require("../config/role");

router.get('/user', verifyToken ,voucherController.getVouchersByUserId);
router.get('/', verifyToken, authorizeRoles(ROLES.ADMIN), voucherController.getAllVouchers);
router.get('/:id', verifyToken, authorizeRoles(ROLES.ADMIN), voucherController.getVoucherById);
router.post('/', verifyToken, authorizeRoles(ROLES.ADMIN), voucherController.createVoucher);
router.put('/:id', verifyToken, authorizeRoles(ROLES.ADMIN), voucherController.updateVoucher);
router.delete('/:id', verifyToken, authorizeRoles(ROLES.ADMIN), voucherController.deleteVoucher);
router.post('/validate', verifyToken, authorizeRoles(ROLES.ADMIN), voucherController.validateVoucher);

module.exports = router;
