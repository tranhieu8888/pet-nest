// Script cập nhật lại ảnh cho petSnapshot trong các spa booking cũ
const mongoose = require("mongoose");
const SpaBooking = require("../models/spaBookingModel");
const Pet = require("../models/petModel");

const MONGO_URI = "mongodb://localhost:27017/pet-nest"; // Sửa lại nếu dùng URI khác

async function updatePetImages() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const bookings = await SpaBooking.find({
    "petSnapshot.image": { $in: [null, "", undefined] },
  });
  let updated = 0;

  for (const booking of bookings) {
    if (!booking.petId) continue;
    const pet = await Pet.findById(booking.petId);
    if (!pet) continue;
    booking.petSnapshot.image = pet.image || "";
    await booking.save();
    updated++;
    console.log(`Updated booking ${booking._id} with pet image: ${pet.image}`);
  }

  console.log(`Done. Updated ${updated} bookings.`);
  await mongoose.disconnect();
}

updatePetImages().catch((err) => {
  console.error("Error updating bookings:", err);
  process.exit(1);
});
