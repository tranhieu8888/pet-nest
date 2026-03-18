const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorization");
const { ROLES } = require("../config/role");

const {
  getMyPets,
  createPet,
  updatePet,
  deletePet,
} = require("../controllers/petController");

// CUSTOMER đăng nhập mới thao tác được pet của mình
router.get("/my-pets", verifyToken, authorizeRoles(ROLES.CUSTOMER), getMyPets);

router.post("/", verifyToken, authorizeRoles(ROLES.CUSTOMER), createPet);

router.put("/:id", verifyToken, authorizeRoles(ROLES.CUSTOMER), updatePet);

router.delete("/:id", verifyToken, authorizeRoles(ROLES.CUSTOMER), deletePet);

module.exports = router;
