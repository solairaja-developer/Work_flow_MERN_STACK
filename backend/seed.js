const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://https://workflow-drefresh.netlify.app');
        
        console.log('Connected to database');
        
        // Clear existing data (optional)
        // await User.deleteMany({});
        
        // Check if admin exists
        const adminExists = await User.findOne({ role: 'admin' });
        
        if (!adminExists) {
            // Create admin user
            const admin = new User({
                username: 'admin',
                email: 'admin@workflow.com',
                password: 'admin123',
                fullName: 'System Administrator',
                role: 'admin',
                department: 'Diary',
                phone: '1234567890',
                position: 'Admin'
            });
            
            await admin.save();
            console.log('✅ Admin user created successfully');
            console.log('📧 Email: admin@workflow.com');
            console.log('🔑 Password: admin123');
        } else {
            console.log('✅ Admin user already exists');
        }
        
        // Create sample manager
        const managerExists = await User.findOne({ email: 'manager@workflow.com' });
        if (!managerExists) {
            const manager = new User({
                username: 'manager',
                email: 'manager@workflow.com',
                password: 'manager123',
                fullName: 'Department Manager',
                role: 'manager',
                department: 'Diary',
                phone: '9876543210',
                position: 'Manager'
            });
            
            await manager.save();
            console.log('✅ Manager user created');
        }
        
        // Create sample staff
        const staffExists = await User.findOne({ email: 'staff@workflow.com' });
        if (!staffExists) {
            const staff = new User({
                username: 'staff',
                email: 'staff@workflow.com',
                password: 'staff123',
                fullName: 'John Doe',
                role: 'staff',
                department: 'Diary',
                phone: '5555555555',
                position: 'Staff'
            });
            
            await staff.save();
            console.log('✅ Staff user created');
        }
        
        console.log('✅ Database seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
