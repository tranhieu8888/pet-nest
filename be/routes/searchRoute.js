const express = require("express");
const router = express.Router();
const { searchSuggestions } = require("../controllers/searchController");

router.get("/suggestions", searchSuggestions);

module.exports = router;
