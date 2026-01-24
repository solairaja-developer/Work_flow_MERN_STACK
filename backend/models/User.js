// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'staff'],
        default: 'staff'
    },
    department: {
        type: String,
        enum: ['Diary', 'Note Book', 'Calendar'],
        required: true
    },
    phone: {
        type: String,
        required: false
    },
    position: {
        type: String,
        enum: ['Manager', 'Supervisor', 'Staff'],
        default: 'Staff'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    profileImage: {
        type: String,
        default: ''
    },
    lastLogin: {
        type: Date
    },
    staffId: {
        type: String,
        unique: true
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);

        // Generate staff ID for non-admin users
        if (this.role !== 'admin' && !this.staffId) {
            const count = await mongoose.models.User.countDocuments({ role: { $ne: 'admin' } });
            this.staffId = `EMP${String(count + 1).padStart(4, '0')}`;
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);