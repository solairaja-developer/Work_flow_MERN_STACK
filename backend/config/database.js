const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connect();
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow_system', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB Connected Successfully');
    } catch (error) {
      console.error('MongoDB Connection Error:', error);
      // Don't exit process in serverless environments
    }
  }

  getConnection() {
    return mongoose.connection;
  }

  getPDOConnection() {
    return mongoose.connection;
  }
}

module.exports = new Database();