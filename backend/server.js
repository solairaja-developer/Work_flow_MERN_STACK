
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Explicit OPTIONS handler for Preflight requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Import database connection - Wrapped to prevent boot crash
try {
    require('./config/database');
} catch (error) {
    console.error('FAILED TO INITIALIZE DATABASE:', error);
    global.dbLoadError = error.message;
}

// Import routes
let routes;
try {
    routes = require('./routes/index');
} catch (error) {
    console.error('FAILED TO LOAD ROUTES:', error);
    global.routeLoadError = error.stack || error.message;
}

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/api/test', (req, res) => res.json({ success: true, message: 'API is working and CORS is configured!' }));

if (routes) {
    // Support both /api/auth/login and /auth/login just in case
    app.use('/api', routes); 
    app.use('/', routes); 
} else {
    app.all('/api/*', (req, res) => res.status(500).json({ 
        success: false, 
        message: 'API Routes failed to load.', 
        error: global.routeLoadError 
    }));
}

// Global 404 handler for any unmatched routes
app.use((req, res) => {
    console.log(`404 at ${req.method} ${req.url}`);
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} not found on this server`
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
