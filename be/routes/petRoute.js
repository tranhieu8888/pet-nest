const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");
const { ROLES } = require("../config/role");
const { upload } = require("../config/upload.js");

const {
  getMyPets,
  createPet,
  updatePet,
  deletePet,
} = require("../controllers/petController");

// CUSTOMER đăng nhập mới thao tác được pet của mình
router.get("/my-pets", verifyToken, authorizeRoles(ROLES.CUSTOMER), getMyPets);

router.post(
  "/",
  verifyToken,
  authorizeRoles(ROLES.CUSTOMER),
  upload.single("image"),
  createPet
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.CUSTOMER),
  upload.single("image"),
  updatePet
);

router.delete("/:id", verifyToken, authorizeRoles(ROLES.CUSTOMER), deletePet);

module.exports = router;
