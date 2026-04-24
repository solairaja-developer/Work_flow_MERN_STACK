const mongoose = require('mongoose');
const User = require('./models/User');
const Task = require('./models/Task');
const Notification = require('./models/Notification');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow_system';

const taskTemplates = {
    'Diary': [
        { title: 'Leather Diary Cover Embossing', description: 'Apply silver foil embossing for the 2024 Executive Diary batch. Check for heat consistency.' },
        { title: 'Diary Page Stitching & Binding', description: 'Corner stitching for A5 size diaries. Ensure the thread tension is balanced.' },
        { title: 'Custom Diary Silk Bookmark Attachment', description: 'Attach blue silk bookmarks to the premium diary collection.' },
        { title: 'Diary Quality Inspection - Batch A', description: 'Inspect the finished diaries for any glue marks or uneven edges.' },
        { title: 'Diary Packaging for Shipping', description: 'Shrink-wrap the finished diaries in packs of 10 for wholesale delivery.' }
    ],
    'Note Book': [
        { title: '100-Pages Ruled Note Book Printing', description: 'Offset printing for the 100-pages ruled notebooks. Check line spacing.' },
        { title: 'A4 Spiral Binding Process', description: 'Punching and spiral binding for A4 student notebooks.' },
        { title: 'Notebook Cover Lamination', description: 'Glossy lamination for the front and back covers of primary school notebooks.' },
        { title: 'Notebook Trimming and Cutting', description: 'Final trimming of rough edges for the bulk notebook order.' },
        { title: 'Carton Packing for Schools', description: 'Box the notebooks and label them for the Government School supply.' }
    ],
    'Calendar': [
        { title: 'Wall Calendar Sheet Collating', description: 'Collate 12 months in correct order for the 2024 Wall Calendar.' },
        { title: 'Desk Calendar Tent Stand Punching', description: 'Hole punching for the triangle tent stands of desk calendars.' },
        { title: 'Calendar Spiral Wiro Binding', description: 'Wiro binding for the multi-colored corporate calendars.' },
        { title: 'Date Correction Check - Wall Calendars', description: 'Verify all public holidays are marked correctly on the 2024 calendar sheets.' },
        { title: 'Calendar Custom Logo Foiling', description: 'Gold foil stamping of corporate logos on the base of desk calendars.' }
    ]
};

const priorities = ['low', 'medium', 'high', 'urgent'];
const statuses = ['pending', 'in_progress', 'completed'];

const seedEverything = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to database');

        const admin = await User.findOne({ role: 'admin' });
        const users = await User.find({ role: { $ne: 'admin' } });

        if (!admin || users.length === 0) {
            console.log('❌ Error: No admin or users found. Run seed-users.js first.');
            process.exit(1);
        }

        // Clear existing tasks and notifications
        await Task.deleteMany({});
        await Notification.deleteMany({});
        console.log('Cleared existing tasks and notifications');

        const tasks = [];
        const notifications = [];
        const now = new Date();

        console.log('Generating 100 realistic tasks and notifications...');

        for (let i = 0; i < 100; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const dept = user.department;
            const templates = taskTemplates[dept];
            const template = templates[Math.floor(Math.random() * templates.length)];
            
            const priority = priorities[Math.floor(Math.random() * priorities.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            const daysAgo = Math.floor(Math.random() * 20);
            const createdAt = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
            const dueDays = Math.floor(Math.random() * 10) + 2;
            const dueDate = new Date(createdAt.getTime() + (dueDays * 24 * 60 * 60 * 1000));

            let completedDate = null;
            let progress = 0;

            if (status === 'completed') {
                progress = 100;
                const completionOffset = Math.floor(Math.random() * (now.getTime() - createdAt.getTime()));
                completedDate = new Date(createdAt.getTime() + completionOffset);
            } else if (status === 'in_progress') {
                progress = Math.floor(Math.random() * 90) + 10;
            }

            const task = new Task({
                title: `${template.title} #${Math.floor(2000 + Math.random() * 5000)}`,
                description: template.description,
                department: dept,
                priority: priority,
                status: status,
                progress: progress,
                assignedTo: user._id,
                assignedBy: admin._id,
                startDate: createdAt,
                dueDate: dueDate,
                completedDate: completedDate,
                createdAt: createdAt,
                updatedAt: completedDate || now
            });

            await task.save();

            // Create notification for assignment
            notifications.push({
                user: user._id,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `You have been assigned a new task: ${task.title}`,
                sender: admin._id,
                senderName: admin.fullName,
                isRead: Math.random() > 0.5, // Some read, some unread
                createdAt: createdAt
            });

            // If completed, add another notification
            if (status === 'completed') {
                notifications.push({
                    user: admin._id,
                    type: 'task_completed',
                    title: 'Task Completed',
                    message: `${user.fullName} has completed the task: ${task.title}`,
                    sender: user._id,
                    senderName: user.fullName,
                    isRead: Math.random() > 0.3,
                    createdAt: completedDate
                });
            }
        }

        await Notification.insertMany(notifications);

        console.log(`\n✅ Successfully seeded 100 tasks and ${notifications.length} notifications!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedEverything();
