const Banner = require("../models/bannerModel");
// const { cloudinary } = require('../config/cloudinary');

exports.createBanner = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl;

    // Nếu có file, upload lên Cloudinary
    if (req.file) {
      // We'll skip cloudinary upload logic for now since it needs config
      imageUrl = req.file.path;
    }

    const bannerData = {
      ...req.body,
      imageUrl,
    };

    const banner = new Banner(bannerData);
    const savedBanner = await banner.save();

    res.status(201).json(savedBanner);
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all banners
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single banner by ID
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a banner
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    if (req.file) {
      banner.imageUrl = req.file.path;
    }

    // Update other fields
    Object.keys(req.body).forEach((key) => {
      banner[key] = req.body[key];
    });

    const updatedBanner = await banner.save();
    res.status(200).json(updatedBanner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a banner
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
