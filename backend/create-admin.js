const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/workflow_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB Connected');
    
    // Define User Schema (must match your model)
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      fullName: String,
      role: String,
      department: String,
      phone: String,
      status: String,
      joinDate: Date,
      createdAt: Date,
      updatedAt: Date
    });
    
    // Check if model already exists
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      console.log('📧 Email:', existingAdmin.email);
      console.log('🔑 Try password: password');
      
      // Update password to 'password' if needed
      const isPasswordCorrect = await bcrypt.compare('password', existingAdmin.password);
      if (!isPasswordCorrect) {
        const hashedPassword = await bcrypt.hash('password', 10);
        existingAdmin.password = hashedPassword;
        await existingAdmin.save();
        console.log('🔑 Password reset to: password');
      }
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('password', 10);
      
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        fullName: 'System Administrator',
        role: 'admin',
        department: 'Diary',
        phone: '979185245',
        status: 'active',
        joinDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@example.com');
      console.log('🔑 Password: password');
      console.log('👤 Role: admin');
    }
    
    // Create a test staff user
    const staffUser = await User.findOne({ email: 'staff@example.com' });
    if (!staffUser) {
      const staffHashedPassword = await bcrypt.hash('password123', 10);
      const newStaff = new User({
        username: 'staff',
        email: 'staff@example.com',
        password: staffHashedPassword,
        fullName: 'Test Staff Member',
        role: 'staff',
        department: 'Note Book',
        phone: '9876543210',
        status: 'active',
        joinDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newStaff.save();
      console.log('✅ Test staff user created!');
      console.log('📧 Email: staff@example.com');
      console.log('🔑 Password: password123');
    }
    
    mongoose.connection.close();
    console.log('✅ Setup completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

createAdminUser();