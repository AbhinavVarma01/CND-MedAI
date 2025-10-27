require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const User = require('./models/User');
const Analysis = require('./models/Analysis');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

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

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    if (USE_JWT) {
      const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'Not authenticated' });

      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.id).select('-passwordHash');
      if (!user) return res.status(404).json({ message: 'User not found' });
      req.user = user;
    } else {
      const email = req.cookies.user_email || req.headers['x-user-email'];
      if (!email) return res.status(401).json({ message: 'Not authenticated' });
      const user = await User.findOne({ email }).select('-passwordHash');
      if (!user) return res.status(404).json({ message: 'User not found' });
      req.user = user;
    }
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

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

// Analysis endpoints
app.post('/api/analysis/upload', authenticateUser, async (req, res) => {
  try {
    const { fileName, fileData, fileType, imageType, fileSize } = req.body;
    
    if (!fileName || !fileData || !imageType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${req.user._id}_${timestamp}${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // Save file (assuming base64 encoded data)
    const base64Data = fileData.replace(/^data:image\/[a-z]+;base64,/, '');
    fs.writeFileSync(filePath, base64Data, 'base64');

    // Create analysis record
    const analysis = new Analysis({
      userId: req.user._id,
      fileName: uniqueFileName,
      originalName: fileName,
      fileType,
      fileSize,
      imageType,
      filePath: `/uploads/${uniqueFileName}`,
      status: 'uploaded'
    });

    const savedAnalysis = await analysis.save();
    
    // Start analysis process (simulated)
    setTimeout(async () => {
      try {
        await performAnalysis(savedAnalysis._id);
      } catch (error) {
        console.error('Analysis failed:', error);
        await Analysis.findByIdAndUpdate(savedAnalysis._id, { status: 'failed' });
      }
    }, 1000);

    res.json({ 
      success: true, 
      analysisId: savedAnalysis._id,
      message: 'File uploaded successfully. Analysis started.' 
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

app.get('/api/analysis/history', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const analyses = await Analysis.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-filePath -thumbnailPath');

    const total = await Analysis.countDocuments({ userId: req.user._id });

    res.json({
      analyses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

app.get('/api/analysis/:id', authenticateUser, async (req, res) => {
  try {
    const analysis = await Analysis.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    }).select('-filePath -thumbnailPath');

    if (!analysis) {
      return res.status(404).json({ message: 'Analysis not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ message: 'Failed to fetch analysis' });
  }
});

// Simulated AI analysis function
async function performAnalysis(analysisId) {
  try {
    // Update status to processing
    await Analysis.findByIdAndUpdate(analysisId, { status: 'processing' });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate mock results based on image type
    const analysis = await Analysis.findById(analysisId);
    const mockResults = generateMockResults(analysis.imageType);

    // Update with results
    await Analysis.findByIdAndUpdate(analysisId, {
      status: 'completed',
      results: mockResults
    });

    console.log(`Analysis completed for ${analysisId}`);
  } catch (error) {
    console.error('Analysis processing error:', error);
    await Analysis.findByIdAndUpdate(analysisId, { status: 'failed' });
  }
}

function generateMockResults(imageType) {
  const results = {
    diagnosis: '',
    confidence: 0,
    findings: [],
    recommendations: [],
    processingTime: Math.floor(Math.random() * 5000) + 2000
  };

  switch (imageType) {
    case 'CT Scan':
      results.diagnosis = Math.random() > 0.3 ? 'Normal chest CT' : 'Abnormal findings detected';
      results.confidence = Math.floor(Math.random() * 20) + 80;
      if (results.diagnosis.includes('Abnormal')) {
        results.findings.push({
          type: 'Nodule',
          description: 'Small pulmonary nodule detected in right upper lobe',
          severity: 'medium',
          confidence: 85
        });
        results.recommendations.push({
          type: 'Follow-up',
          description: 'Recommend follow-up CT scan in 3-6 months',
          priority: 'medium'
        });
      }
      break;

    case 'MRI':
      results.diagnosis = Math.random() > 0.4 ? 'Normal brain MRI' : 'Abnormal signal detected';
      results.confidence = Math.floor(Math.random() * 15) + 85;
      if (results.diagnosis.includes('Abnormal')) {
        results.findings.push({
          type: 'Lesion',
          description: 'Hyperintense signal in T2-weighted images',
          severity: 'high',
          confidence: 92
        });
        results.recommendations.push({
          type: 'Consultation',
          description: 'Recommend neurological consultation',
          priority: 'high'
        });
      }
      break;

    case 'Histopathology':
      results.diagnosis = Math.random() > 0.5 ? 'Normal tissue' : 'Abnormal cellular patterns';
      results.confidence = Math.floor(Math.random() * 25) + 75;
      if (results.diagnosis.includes('Abnormal')) {
        results.findings.push({
          type: 'Dysplasia',
          description: 'Mild to moderate dysplasia observed',
          severity: 'high',
          confidence: 88
        });
        results.recommendations.push({
          type: 'Biopsy',
          description: 'Recommend additional tissue sampling',
          priority: 'high'
        });
      }
      break;

    default:
      results.diagnosis = 'Analysis completed';
      results.confidence = Math.floor(Math.random() * 30) + 70;
  }

  return results;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Auth server listening on ${PORT}`));
