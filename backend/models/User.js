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
const bcrypt = require('bcrypt');

// Function to hash a password
async function hashPassword(password) {
  const saltRounds = 10; // Number of salt rounds
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}

// Example usage
const password = 'userPassword123';
hashPassword(password).then((hashedPassword) => {
  console.log('Hashed Password:', hashedPassword);
});
// Prevent model overwrite issues in server restarts
const User = mongoose.models.User || mongoose.model('User', UserSchema);
module.exports = User;
