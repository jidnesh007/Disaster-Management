import mongoose from "mongoose";

const requestedItemSchema = new mongoose.Schema({
  resourceName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['food', 'water', 'clothing', 'medicine', 'shelter', 'medical_equipment', 'other']
  },
  quantityNeeded: {
    type: Number,
    required: true,
    min: 1
  },
  quantityFulfilled: {
    type: Number,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'liters', 'pieces', 'boxes', 'bottles', 'packets', 'units']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  description: String,
  specifications: String // e.g., "Size: Large", "Type: Blankets", etc.
});

const donationRequestSchema = new mongoose.Schema({
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
  },
  facilityInfo: {
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    contactPerson: String,
    contactPhone: String
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  items: [requestedItemSchema],
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  targetDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'partially_fulfilled', 'fulfilled', 'expired', 'cancelled'],
    default: 'active'
  },
  beneficiaries: {
    count: {
      type: Number,
      required: true,
      min: 1
    },
    demographics: {
      adults: { type: Number, default: 0 },
      children: { type: Number, default: 0 },
      elderly: { type: Number, default: 0 },
      disabled: { type: Number, default: 0 }
    }
  },
  disaster: {
    type: {
      type: String,
      enum: ['flood', 'earthquake', 'cyclone', 'fire', 'epidemic', 'drought', 'other']
    },
    affectedArea: String,
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe', 'catastrophic']
    }
  },
  visibility: {
    type: String,
    enum: ['public', 'registered_users', 'coordinators_only'],
    default: 'public'
  },
  tags: [String],
  images: [{
    url: String,
    description: String
  }],
  donationsMade: [{
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation'
    },
    donorName: String,
    items: [{
      resourceName: String,
      quantity: Number,
      unit: String
    }],
    receivedDate: {
      type: Date,
      default: Date.now
    }
  }],
  updates: [{
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  metrics: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalDonors: {
      type: Number,
      default: 0
    },
    totalDonationsReceived: {
      type: Number,
      default: 0
    },
    fulfillmentPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true
});

// Calculate fulfillment percentage
donationRequestSchema.methods.calculateFulfillment = function() {
  let totalNeeded = 0;
  let totalFulfilled = 0;

  this.items.forEach(item => {
    totalNeeded += item.quantityNeeded;
    totalFulfilled += item.quantityFulfilled;
  });

  this.metrics.fulfillmentPercentage = totalNeeded > 0 ? 
    Math.round((totalFulfilled / totalNeeded) * 100) : 0;

  // Update status based on fulfillment
  if (this.metrics.fulfillmentPercentage >= 100) {
    this.status = 'fulfilled';
  } else if (this.metrics.fulfillmentPercentage > 0) {
    this.status = 'partially_fulfilled';
  }

  return this.metrics.fulfillmentPercentage;
};

// Auto-update status based on target date
donationRequestSchema.pre('save', function(next) {
  if (this.targetDate < new Date() && this.status === 'active') {
    this.status = 'expired';
  }
  next();
});

// Indexes for efficient queries
donationRequestSchema.index({ status: 1, urgencyLevel: -1, createdAt: -1 });
donationRequestSchema.index({ facilityId: 1, status: 1 });
donationRequestSchema.index({ 'disaster.type': 1, urgencyLevel: -1 });
donationRequestSchema.index({ tags: 1 });
donationRequestSchema.index({ targetDate: 1, status: 1 });

export default mongoose.model('DonationRequest', donationRequestSchema);