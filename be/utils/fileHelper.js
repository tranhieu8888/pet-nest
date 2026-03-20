/**
 * Generates a full URL for an uploaded file.
 */
const getImageUrl = (req, filename) => {
  if (!filename) return null;
  return `${req.protocol}://${req.get("host")}/uploads/${filename}`;
};

module.exports = { getImageUrl };
