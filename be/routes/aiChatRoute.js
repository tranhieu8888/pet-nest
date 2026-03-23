const express = require("express");
const router = express.Router();

const { chatWithAI } = require("../controllers/aiChatController");

// Chatbot AI cho customer/guest
router.post("/chat", chatWithAI);

module.exports = router;
