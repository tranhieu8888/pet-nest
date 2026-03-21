const express = require("express");
const router = express.Router();
const { handlePayOSWebhook, getPaymentHistory, syncPaymentStatus } = require("../controllers/paymentController");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");
const { ROLES } = require("../config/role");

// Webhook không cần auth vì do PayOS gọi, nhưng sẽ verify signature
router.post("/payos-webhook", handlePayOSWebhook);

// Đồng bộ trạng thái thanh toán (Cho phép khách hàng tự nhấn sync hoặc tự động sync khi quay về)
router.post("/sync-status", syncPaymentStatus);

// Lịch sử thanh toán cho staff
router.get("/staff-history", verifyToken, authorizeRoles(ROLES.STAFF), getPaymentHistory);

module.exports = router;
