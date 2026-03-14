const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
require('dotenv').config();

const departments = ['Diary', 'Note Book', 'Calendar'];
const priorities = ['low', 'medium', 'high', 'urgent'];
const statuses = ['pending', 'in_progress', 'completed'];

const seedTasks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow_system');
        console.log('Connected to DB');

        const admin = await User.findOne({ role: 'admin' });
        const staffList = await User.find({ role: { $in: ['staff', 'manager'] } });

        if (!admin || staffList.length === 0) {
            console.log('Please run seed.js first to create users');
            process.exit(1);
        }

        // Generate 150 tasks
        const tasks = [];
        const now = new Date();

        for (let i = 0; i < 150; i++) {
            const dept = departments[Math.floor(Math.random() * departments.length)];
            const priority = priorities[Math.floor(Math.random() * priorities.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            // Random dates within last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
            
            // Due date: some overdue, some future
            const dueDays = Math.floor(Math.random() * 20) - 5; // -5 to 15 days from creation
            const dueDate = new Date(createdAt.getTime() + (dueDays * 24 * 60 * 60 * 1000));

            let completedDate = null;
            let progress = 0;

            if (status === 'completed') {
                progress = 100;
                // Completed between creation and now
                const completionOffset = Math.floor(Math.random() * (now.getTime() - createdAt.getTime()));
                completedDate = new Date(createdAt.getTime() + completionOffset);
            } else if (status === 'in_progress') {
                progress = Math.floor(Math.random() * 90) + 10;
            }

            const staff = staffList[Math.floor(Math.random() * staffList.length)];

            tasks.push({
                workId: `WRK-${Math.floor(10000 + Math.random() * 90000)}`,
                title: `Task Assignment ${i + 1} for ${dept}`,
                description: `This is an auto-generated task for the ${dept} department. Needs attention depending on priority.`,
                department: dept,
                priority: priority,
                status: status,
                progress: progress,
                assignedTo: staff._id,
                assignedBy: admin._id,
                startDate: createdAt,
                dueDate: dueDate,
                completedDate: completedDate,
                createdAt: createdAt,
                updatedAt: completedDate || now
            });
        }

        await Task.insertMany(tasks);
        console.log(`✅ Successfully seeded ${tasks.length} realistic tasks!`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedTasks();
