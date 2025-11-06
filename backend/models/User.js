const mongoose = require('mongoose');
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'users';

const UserSchema = new mongoose.Schema({
  fullName: { type: String },
  doctorId: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  hospitalName: { type: String },
  area: { type: String },
  profilePicture: { type: String }, // base64 encoded image
}, { timestamps: true, collection: COLLECTION_NAME });

const bcrypt = require('bcryptjs');

// Hash a password before saving it to the database
async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

// Compare a plain password with a hashed password
async function comparePasswords(plainPassword, hashedPassword) {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
}

module.exports = { hashPassword, comparePasswords };