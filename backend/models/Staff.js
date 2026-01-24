const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staffId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: true
  },
  department: {
    type: String,
    enum: ['Diary', 'Note Book', 'Calendar'],
    required: true
  },
  position: {
    type: String,
    enum: ['Manager', 'Supervisor', 'Staff'],
    default: 'Staff'
  },
  address: String,
  notes: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Fix the pre-save hook to generate staffId
staffSchema.pre('save', async function(next) {
  // Only generate staffId if it's a new document and staffId is not already set
  if (this.isNew && !this.staffId) {
    try {
      // Find the last staff member to get the highest number
      const lastStaff = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
      
      let nextNumber = 1;
      if (lastStaff && lastStaff.staffId) {
        // Extract number from staffId (e.g., "STAFF-001" -> 1)
        const matches = lastStaff.staffId.match(/STAFF-(\d+)/);
        if (matches && matches[1]) {
          nextNumber = parseInt(matches[1]) + 1;
        }
      }
      
      // Format as STAFF-001, STAFF-002, etc.
      this.staffId = `STAFF-${String(nextNumber).padStart(3, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Alternative: Create a static method to generate staffId
staffSchema.statics.generateStaffId = async function() {
  const lastStaff = await this.findOne({}, {}, { sort: { 'createdAt': -1 } });
  
  let nextNumber = 1;
  if (lastStaff && lastStaff.staffId) {
    const matches = lastStaff.staffId.match(/STAFF-(\d+)/);
    if (matches && matches[1]) {
      nextNumber = parseInt(matches[1]) + 1;
    }
  }
  
  return `STAFF-${String(nextNumber).padStart(3, '0')}`;
};

module.exports = mongoose.model('Staff', staffSchema);