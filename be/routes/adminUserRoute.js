const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminUserController");

router.get("/", ctrl.getAll);

module.exports = router;
