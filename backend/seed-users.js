const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow_system';

const users = [
    // 1 Admin
    {
        username: 'admin',
        email: 'admin@workflow.com',
        password: 'password123',
        fullName: 'System Administrator',
        role: 'admin',
        department: 'Diary',
        position: 'Admin',
        phone: '1234567890'
    },
    // 3 Managers (one for each department)
    {
        username: 'diary_manager',
        email: 'manager.diary@workflow.com',
        password: 'password123',
        fullName: 'Arun Kumar',
        role: 'manager',
        department: 'Diary',
        position: 'Manager',
        phone: '9840012345'
    },
    {
        username: 'notebook_manager',
        email: 'manager.notebook@workflow.com',
        password: 'password123',
        fullName: 'Priya Sharma',
        role: 'manager',
        department: 'Note Book',
        position: 'Manager',
        phone: '9840054321'
    },
    {
        username: 'calendar_manager',
        email: 'manager.calendar@workflow.com',
        password: 'password123',
        fullName: 'Karthik Raja',
        role: 'manager',
        department: 'Calendar',
        position: 'Manager',
        phone: '9840098765'
    },
    // 6 Staff (two for each department)
    {
        username: 'staff_diary_1',
        email: 'staff1.diary@workflow.com',
        password: 'password123',
        fullName: 'Meena Iyer',
        role: 'staff',
        department: 'Diary',
        position: 'Staff',
        phone: '9900011122'
    },
    {
        username: 'staff_diary_2',
        email: 'staff2.diary@workflow.com',
        password: 'password123',
        fullName: 'Rahul Dravid',
        role: 'staff',
        department: 'Diary',
        position: 'Staff',
        phone: '9900033344'
    },
    {
        username: 'staff_notebook_1',
        email: 'staff1.notebook@workflow.com',
        password: 'password123',
        fullName: 'Sanjay Ramasamy',
        role: 'staff',
        department: 'Note Book',
        position: 'Staff',
        phone: '9900055566'
    },
    {
        username: 'staff_notebook_2',
        email: 'staff2.notebook@workflow.com',
        password: 'password123',
        fullName: 'Vikram Singh',
        role: 'staff',
        department: 'Note Book',
        position: 'Staff',
        phone: '9900077788'
    },
    {
        username: 'staff_calendar_1',
        email: 'staff1.calendar@workflow.com',
        password: 'password123',
        fullName: 'Anita Reddy',
        role: 'staff',
        department: 'Calendar',
        position: 'Staff',
        phone: '9900099900'
    },
    {
        username: 'staff_calendar_2',
        email: 'staff2.calendar@workflow.com',
        password: 'password123',
        fullName: 'Deepak Verma',
        role: 'staff',
        department: 'Calendar',
        position: 'Staff',
        phone: '9900022233'
    }
];

const seedUsers = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to database');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Insert new users
        // We use save() instead of insertMany to trigger the pre('save') hook for hashing passwords and generating staff IDs
        for (const userData of users) {
            const user = new User(userData);
            await user.save();
            console.log(`Created user: ${user.username} (${user.role})`);
        }

        console.log('\n✅ Successfully seeded 10 users!');
        console.log('All passwords are: password123');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
