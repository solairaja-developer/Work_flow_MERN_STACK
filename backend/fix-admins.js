const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function fixAdmins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow_system');
        
        console.log('Connected to DB');
        
        const admins = await User.find({ role: 'admin' });
        console.log('Found admins:', admins.map(a => a.email));
        
        for (let admin of admins) {
            console.log(`Fixing password for ${admin.email}...`);
            // since we fixed double hashing, setting it to 'admin123' will trigger pre('save') to hash it correctly
            admin.password = 'admin123';
            if (!admin.department) admin.department = 'Diary';
            await admin.save();
            console.log(`Password reset to 'admin123' for ${admin.email}`);
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.connection.close();
    }
}

fixAdmins();
