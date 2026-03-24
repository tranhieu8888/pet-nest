const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  ward: { type: String },
  district: { type: String },
  province: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String, required: true, default: 'Vietnam' }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: [addressSchema],
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  dob: { type: Date },
  role: { type: Number, default: 1 },
  verified: { type: Boolean, default: false },
  verificationToken: {
    type: String,
    trim: true,
  },
  verificationTokenExpires: { type: Date },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  bannedUntil: { type: Date, default: null }
}, { timestamps: true }, { collection: 'users' });


const parseRoles = (bitmask) => {
  const activeRoles = [];

  for (const [roleName, roleValue] of Object.entries(ROLES)) {
    if (roleValue !== 0 && (bitmask & roleValue) === roleValue) {
      activeRoles.push(roleName);
    }
  }

  // Riêng ADMIN là 0, nên ta xét đặc biệt:
  if (bitmask === 0) {
    activeRoles.push('ADMIN');
  }

  return activeRoles;
};


module.exports = mongoose.model('User', userSchema);