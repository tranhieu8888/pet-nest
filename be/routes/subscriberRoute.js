const express = require("express");
const router = express.Router();
const subscriberController = require("../controllers/subscriberController");
const verifyToken = require("../middleware/auth");

// public
router.post("/", subscriberController.createSubscriber);
router.get("/unsubscribe", subscriberController.unsubscribeByEmail);

// admin
router.get("/", verifyToken, subscriberController.getSubscribers);
router.patch(
  "/:id/unsubscribe",
  verifyToken,
  subscriberController.unsubscribeSubscriber
);
router.patch(
  "/:id/activate",
  verifyToken,
  subscriberController.activateSubscriber
);
router.delete("/:id", verifyToken, subscriberController.deleteSubscriber);

module.exports = router;
