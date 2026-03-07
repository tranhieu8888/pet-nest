const express = require("express");
const router = express.Router();
const bannerController = require("../controllers/bannerController");
const { upload } = require("../config/upload");

router.post("/", upload.single("image"), bannerController.createBanner);
router.get("/", bannerController.getAllBanners);
router.get("/:id", bannerController.getBannerById);
router.put("/:id", upload.single("image"), bannerController.updateBanner);
router.delete("/:id", bannerController.deleteBanner);

module.exports = router;
