const mongoose = require('mongoose');
const moment = require('moment-timezone');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const StaffSchedule = require('../models/staffScheduleModel');
const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pet-nest');
        console.log("Connected to MongoDB");

        const schedules = await StaffSchedule.find({ isDeleted: false });
        console.log(`Found ${schedules.length} schedules to update`);

        for (const s of schedules) {
            // Lấy ngày hiện tại (đang là 00:00 UTC)
            const currentDate = s.workDate;
            
            // Chuyển sang mốc 00:00 của ngày đó theo giờ Việt Nam
            // (Tương đương 17:00 UTC ngày hôm trước)
            const newDate = moment.tz(currentDate, VN_TIMEZONE).startOf('day').toDate();
            
            console.log(`Updating ID ${s._id}: ${currentDate.toISOString()} -> ${newDate.toISOString()}`);
            
            await StaffSchedule.findByIdAndUpdate(s._id, { workDate: newDate });
        }

        console.log("Migration completed successfully");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
