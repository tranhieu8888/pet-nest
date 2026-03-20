const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/adminSpaServiceController");
const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");
const { ROLES } = require("../config/role");
const { upload } = require("../config/upload");

router.use(verifyToken);
router.use(authorizeRoles(ROLES.ADMIN));

router.get("/", ctrl.getAllSpaServices);
router.get("/:id", ctrl.getSpaServiceById);
router.post("/", upload.single("image"), ctrl.createSpaService);
router.put("/:id", upload.single("image"), ctrl.updateSpaService);
router.delete("/:id", ctrl.deleteSpaService);

module.exports = router;
