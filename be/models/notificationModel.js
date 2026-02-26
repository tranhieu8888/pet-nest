const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({});
module.exports = mongoose.model('Notification', notificationSchema);
