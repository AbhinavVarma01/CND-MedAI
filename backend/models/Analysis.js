const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  fileType: { 
    type: String, 
    required: true 
  },
  fileSize: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded'
  },
  results: {
    diagnosis: { 
      type: String, 
      default: 'Analysis pending' 
    },
    confidence: { 
      type: Number, 
      min: 0, 
      max: 100, 
      default: 0 
    },
    findings: [{
      type: { 
        type: String, 
        required: true 
      },
      description: { 
        type: String, 
        required: true 
      },
      severity: { 
        type: String, 
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
      },
      confidence: { 
        type: Number, 
        min: 0, 
        max: 100 
      }
    }],
    recommendations: [{
      type: { 
        type: String, 
        required: true 
      },
      description: { 
        type: String, 
        required: true 
      },
      priority: { 
        type: String, 
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    processingTime: { 
      type: Number, 
      default: 0 
    }
  },
  filePath: { 
    type: String, 
    required: true 
  },
  thumbnailPath: { 
    type: String 
  },
  metadata: {
    dimensions: {
      width: Number,
      height: Number,
      depth: Number
    },
    modality: String,
    studyDate: Date,
    patientAge: Number,
    patientSex: String,
    bodyPart: String
  }
}, { 
  timestamps: true,
  collection: 'analyses'
});

// Index for efficient queries
AnalysisSchema.index({ userId: 1, createdAt: -1 });
AnalysisSchema.index({ status: 1 });
AnalysisSchema.index({ imageType: 1 });

// Prevent model overwrite issues in server restarts
const Analysis = mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema);
module.exports = Analysis;
