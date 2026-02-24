import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const incidentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['POACHING', 'ILLEGAL_LOGGING', 'WILDLIFE_TRADE', 'HABITAT_DESTRUCTION', 'OTHER'],
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  zoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true,
    index: true
  },
  protectedAreaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProtectedArea',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['REPORTED', 'VERIFIED', 'INVESTIGATING', 'RESOLVED', 'UNVERIFIED'],
    default: 'REPORTED',
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM',
    required: true,
    index: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  incidentDate: {
    type: Date,
    required: true,
    index: true
  },
  evidence: [{
    type: String, // URLs to evidence files
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
incidentSchema.index({ protectedAreaId: 1, isDeleted: 1, incidentDate: -1 });
incidentSchema.index({ zoneId: 1, isDeleted: 1, incidentDate: -1 });
incidentSchema.index({ status: 1, isDeleted: 1 });
incidentSchema.index({ type: 1, isDeleted: 1 });
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ incidentDate: -1, isDeleted: 1 });

// Enable pagination
incidentSchema.plugin(mongoosePaginate);

// Alert trigger middleware
incidentSchema.post('save', async function (doc) {
  if (doc.type === 'POACHING' || doc.severity === 'CRITICAL' || doc.severity === 'HIGH') {
    try {
      const { triggerIncidentAlert } = await import('../services/alert.service.js');
      // We need the zone name, but it's not in the doc. We can fetch it if needed or just use zoneId
      // For now, let's fetch the zone to get the name for a meaningful message
      const Zone = mongoose.model('Zone');
      const zone = await Zone.findById(doc.zoneId);
      await triggerIncidentAlert(doc, zone ? zone.name : 'Unknown Zone');
    } catch (error) {
      console.error('Failed to trigger incident alert from middleware:', error);
    }
  }
});

export default mongoose.model('Incident', incidentSchema);