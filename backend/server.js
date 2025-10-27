require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;
const JWT_SECRET = process.env.JWT_SECRET;
const USE_JWT = !!JWT_SECRET; // if JWT_SECRET is provided, use JWTs; otherwise fallback to simple cookie

const mongooseOptions = { useNewUrlParser: true, useUnifiedTopology: true };
if (DB_NAME) mongooseOptions.dbName = DB_NAME;

mongoose.connect(MONGO_URI, mongooseOptions)
  .then(() => {
    console.log('MongoDB connected');
    try {
      const dbName = mongoose.connection.db.databaseName;
      console.log('Connected to database:', dbName);
    } catch (e) {
      // ignore if not available
    }
  })
  .catch(err => console.error('MongoDB connection error', err));

app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password, hospitalName, area } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ fullName, email, passwordHash, hospitalName, area });
  const saved = await user.save();
  console.log('User saved:', saved._id.toString());

    if (USE_JWT) {
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
      return res.json({ token, user: { id: user._id, email: user.email, fullName: user.fullName } });
    }

    // If not using JWT, set a readable cookie with the user email to identify the session
    res.cookie('user_email', user.email, { httpOnly: false, sameSite: 'lax' });
    return res.json({ user: { id: user._id, email: user.email, fullName: user.fullName } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    console.log('Login attempt for:', email);
    const user = await User.findOne({ email });
    console.log('User lookup result:', user ? user._id.toString() : 'not found');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.passwordHash) {
      console.error('User record missing passwordHash:', user._id.toString());
      return res.status(500).json({ message: 'Server error' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (USE_JWT) {
      const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
      return res.json({ token, user: { id: user._id, email: user.email, fullName: user.fullName } });
    }

    res.cookie('user_email', user.email, { httpOnly: false, sameSite: 'lax' });
    return res.json({ user: { id: user._id, email: user.email, fullName: user.fullName } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (USE_JWT) {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Not authenticated' });

      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.id).select('-passwordHash');
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json({ user });
    }

    // Fallback: match by email cookie/header when JWT is not used
    const email = req.cookies.user_email || req.headers['x-user-email'];
    if (!email) return res.status(401).json({ message: 'Not authenticated' });
    const user = await User.findOne({ email }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  try {
    res.clearCookie('token');
    res.clearCookie('user_email');
    return res.json({ ok: true });
  } catch (err) {
    console.error('Logout error', err);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Auth server listening on ${PORT}`));
