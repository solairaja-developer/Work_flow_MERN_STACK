const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Task = require('./models/Task');
const Notification = require('./models/Notification');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow_system';

const departments = ['Diary', 'Note Book', 'Calendar'];
const roles = ['manager', 'staff'];
const statuses = ['pending', 'in_progress', 'completed'];
const priorities = ['low', 'medium', 'high', 'urgent'];

async function seedRichData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to Database');

        // 1. Ensure Admin exists
        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            admin = new User({
                username: 'admin',
                email: 'admin@workflow.com',
                password: 'admin123',
                fullName: 'System Administrator',
                role: 'admin',
                department: 'Diary',
                position: 'Admin'
            });
            await admin.save();
            console.log('Admin created.');
        }

        // 2. Add realistic staff and managers for each department if they don't exist
        const names = [
            'Arun Kumar', 'Priya Sharma', 'Karthik Raja', 'Meena Iyer', 
            'Rahul Dravid', 'Sanjay Ramasamy', 'Vikram Singh', 'Anita Reddy',
            'Mohammed Tariq', 'Sarah Gonsalves', 'Deepak Verma', 'Pooja Hegde'
        ];
        
        let nameIndex = 0;
        for (const dept of departments) {
            // Ensure 1 manager per dept
            let manager = await User.findOne({ role: 'manager', department: dept });
            if (!manager) {
                const mName = `${dept.split(' ')[0]} Manager`;
                manager = new User({
                    username: `manager_${dept.toLowerCase().replace(' ', '')}`,
                    email: `manager.${dept.toLowerCase().replace(' ', '')}@workflow.com`,
                    password: 'password123',
                    fullName: mName,
                    role: 'manager',
                    department: dept,
                    position: 'Manager',
                    phone: '9876543210',
                    staffId: `MGR-${Math.floor(1000 + Math.random() * 9000)}-${dept.slice(0, 3).toUpperCase()}`
                });
                await manager.save();
                console.log(`Created Manager for ${dept}`);
            }

            // Ensure 3 staff per dept
            const staffCount = await User.countDocuments({ role: 'staff', department: dept });
            for (let i = staffCount; i < 3; i++) {
                const sName = names[nameIndex % names.length];
                nameIndex++;
                
                let baseUsername = sName.toLowerCase().replace(' ', '.');
                let username = baseUsername;
                let userExists = await User.findOne({ username });
                let suffix = 1;
                while(userExists) {
                    username = `${baseUsername}${suffix}`;
                    userExists = await User.findOne({ username });
                    suffix++;
                }

                const staff = new User({
                    username: username,
                    email: `${username}@workflow.com`,
                    password: 'password123',
                    fullName: sName,
                    role: 'staff',
                    department: dept,
                    position: 'Staff',
                    phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
                    staffId: `STF-${Math.floor(10000 + Math.random() * 90000)}`
                });
                await staff.save();
                console.log(`Created Staff ${staff.fullName} for ${dept}`);
            }
        }

        // 3. Generate tons of tasks across all staff & managers
        await Task.deleteMany({});
        console.log('Cleared old tasks. Generating 300 realistic tasks...');
        
        const allUsers = await User.find({ role: { $in: ['staff', 'manager'] } });
        const now = new Date();
        const tasks = [];

        for (let i = 0; i < 300; i++) {
            const assignee = allUsers[Math.floor(Math.random() * allUsers.length)];
            const dept = assignee.department;
            const priority = priorities[Math.floor(Math.random() * priorities.length)];
            
            // Bias statuses towards completed (60%), in_progress (25%), pending (15%)
            const r = Math.random();
            let status = 'completed';
            if (r > 0.85) status = 'pending';
            else if (r > 0.60) status = 'in_progress';

            const daysAgo = Math.floor(Math.random() * 30); // Task created anytime in last 30 days
            const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
            // Add some random hours
            createdAt.setHours(Math.floor(Math.random() * 24));
            
            // Due date is usually 2 to 10 days after creation
            const dueDays = Math.floor(Math.random() * 8) + 2; 
            const dueDate = new Date(createdAt.getTime() + (dueDays * 24 * 60 * 60 * 1000));

            let completedDate = null;
            let progress = 0;
            let updatedAt = createdAt;

            if (status === 'completed') {
                progress = 100;
                // Bias completion towards being on-time (80% chance)
                if (Math.random() < 0.8) {
                    // completed before due
                    const maxOffset = dueDate.getTime() - createdAt.getTime();
                    // if dueDate is in the future, cap offset to 'now'
                    const cap = Math.min(maxOffset, now.getTime() - createdAt.getTime());
                    const completionOffset = Math.random() * cap;
                    completedDate = new Date(createdAt.getTime() + completionOffset);
                } else {
                    // completed late (after due)
                    const lateOffset = Math.random() * (5 * 24 * 60 * 60 * 1000); // up to 5 days late
                    completedDate = new Date(dueDate.getTime() + lateOffset);
                    if (completedDate > now) completedDate = new Date(now.getTime() - 100000);
                }
                updatedAt = completedDate;
            } else if (status === 'in_progress') {
                progress = Math.floor(Math.random() * 90) + 10;
                updatedAt = new Date(createdAt.getTime() + Math.random() * (now.getTime() - createdAt.getTime()));
            }

            // Create comments
            const comments = [];
            if (status !== 'pending' && Math.random() > 0.5) {
                comments.push({
                    user: assignee._id,
                    text: `Working on this ${dept} task...`,
                    date: new Date(createdAt.getTime() + 100000)
                });
            }

            let title = '';
            let description = '';

            if (dept === 'Diary') {
                const diaryTasks = [
                    'Executive Leather Diary 2024 Printing',
                    'Pocket Diary Spiral Binding',
                    'Custom Corporate Diary Gold Foiling',
                    'A5 Diary Page Sorting and Quality Check',
                    'Diary Cover Embossing Process'
                ];
                title = diaryTasks[Math.floor(Math.random() * diaryTasks.length)] + ` - Batch ${Math.floor(Math.random() * 1000)}`;
                description = `Please handle the ${dept} binding and production phase carefully. Ensure leather covers are glued correctly and page alignment is perfect.`;
            } else if (dept === 'Note Book') {
                const notebookTasks = [
                    'A4 Unruled Notebook Bulk Production',
                    'Spiral Notebook Cover Board Printing',
                    '100-Pages Ruled Notebook Stitching',
                    'Student Geometry Notebook Trimming',
                    'College Subject Notebook Packaging'
                ];
                title = notebookTasks[Math.floor(Math.random() * notebookTasks.length)] + ` - Batch ${Math.floor(Math.random() * 1000)}`;
                description = `Proceed with the ${dept} cutting, ruling, and pinning process. Check the paper thickness and rule line consistency continuously.`;
            } else if (dept === 'Calendar') {
                const calendarTasks = [
                    'Desk Calendar 2024 Spiral Binding',
                    'Wall Calendar Offset Printing',
                    'Daily Tear-off Calendar Collating',
                    'Corporate Theme Calendar Designing',
                    'Calendar Custom Logo Foil Stamping'
                ];
                title = calendarTasks[Math.floor(Math.random() * calendarTasks.length)] + ` - Batch ${Math.floor(Math.random() * 1000)}`;
                description = `Begin the ${dept} sheet alignment and punch holing. Ensure the date sequence matches the 2024 leap year structure exactly.`;
            }

            tasks.push({
                workId: `WKF-${Math.floor(10000 + Math.random() * 90000)}`,
                title: title,
                description: description,
                department: dept,
                priority: priority,
                status: status,
                progress: progress,
                assignedTo: assignee._id,
                assignedBy: admin._id,
                startDate: createdAt,
                dueDate: dueDate,
                completedDate: completedDate,
                createdAt: createdAt,
                updatedAt: updatedAt,
                comments: comments
            });
        }

        await Task.insertMany(tasks);
        console.log(`✅ Successfully inserted ${tasks.length} highly realistic tasks.`);

        // 4. Generate random notifications for staff & manager
        const notifs = [];
        for (const user of allUsers) {
            // Give them 3-5 unread notifications
            const count = Math.floor(Math.random() * 3) + 3;
            for(let i=0; i<count; i++) {
                notifs.push({
                    user: user._id,
                    type: 'task_assigned',
                    title: i % 2 === 0 ? 'Urgent Task Assigned' : 'Weekly Review Due',
                    message: `Please review the latest updates for ${user.department} operations.`,
                    isRead: Math.random() > 0.7,
                    createdBy: admin._id,
                    createdAt: new Date(now.getTime() - (Math.random() * 7 * 24 * 60 * 60 * 1000))
                });
            }
        }
        await Notification.insertMany(notifs);
        console.log(`✅ Emitted ${notifs.length} internal unread notifications to team members.`);

        console.log('\n============== LOGIN ROSTER ==============');
        const showUsers = await User.find({ role: { $in: ['staff', 'manager'] } }).sort({ role: 1, department: 1 });
        showUsers.forEach(u => {
            console.log(`Role: ${u.role.padEnd(8)} | Dept: ${u.department.padEnd(10)} | Email: ${u.email} (Pass: password123)`);
        });
        console.log('==========================================');

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedRichData();
