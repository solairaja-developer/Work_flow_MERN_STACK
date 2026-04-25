const mongoose = require('mongoose');

// Serverless friendly database connection cache
let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected.');
    return;
  }

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow_system';
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, 
    });
    
    isConnected = true;
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    // Let the route handler catch this if it fails
  }
};

// Start connection immediately when required
connectDB();

module.exports = {
  connect: connectDB,
  getConnection: () => mongoose.connection,
  getPDOConnection: () => mongoose.connection
};