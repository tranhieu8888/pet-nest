const User = require("../models/userModel");
const { sendNotification } = require("./sendNotification");

/**
 * Notifies the first found admin about an event.
 */
const notifyAdmin = async ({ title, description, type }) => {
  try {
    const admin = await User.findOne({ role: 0 }).select("_id");
    if (!admin) {
      console.warn("notifyAdmin: No admin account found with role: 0");
      return null;
    }

    return await sendNotification({
      userId: admin._id.toString(),
      title,
      description,
      type,
    });
  } catch (error) {
    console.error("notifyAdmin Error:", error.message);
    return null;
  }
};

module.exports = { notifyAdmin };
