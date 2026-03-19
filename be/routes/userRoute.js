const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/auth');
const { ROLES } = require('../config/role');
const authorizeRoles = require('../middleware/authorization');

// Export users csv
router.get('/export-csv', verifyToken, authorizeRoles(ROLES.ADMIN), userController.exportUsersToCSV);

router.get('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.STAFF), userController.getAllUsers);

router.get('/admin', verifyToken, authorizeRoles(ROLES.ADMIN), userController.getAllUsers);

router.get('/dashboard', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.STAFF), userController.getUserDashboard);

router.get('/orders', verifyToken, userController.getAllOrders);

router.post('/addresses', verifyToken, userController.addAddress);

router.put('/addresses/:addressId', verifyToken, userController.editAddress);

router.delete('/addresses/:addressId', verifyToken, userController.deleteAddress);

router.put('/edit-profile', verifyToken, userController.updateProfile);

// Test routes cho Cron Job
router.get('/banned', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.STAFF), userController.getBannedUsers);
router.post('/unban', verifyToken, authorizeRoles(ROLES.ADMIN), userController.manualUnbanUsers);

router.put('/:id', verifyToken, authorizeRoles(ROLES.ADMIN), userController.updateUser);
router.get('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.STAFF), userController.getUserById);
router.delete('/:id', verifyToken, authorizeRoles(ROLES.ADMIN), userController.deleteUser);

router.post('/', verifyToken, authorizeRoles(ROLES.ADMIN), userController.createUser);

// Import users from CSV
router.post('/import-csv', verifyToken, authorizeRoles(ROLES.ADMIN), userController.importUsersFromCSV);

module.exports = router;
