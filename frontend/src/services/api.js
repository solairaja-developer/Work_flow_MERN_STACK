// frontend/src/services/api.js
import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const IMAGE_BASE_URL = API_URL.replace('/api', '');

const API = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle errors
API.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => API.post('/auth/login', credentials),
    register: (userData) => API.post('/auth/register', userData),
    getProfile: () => API.get('/auth/profile'),
    updateProfile: (data) => API.put('/auth/profile', data)
};

// Admin API
export const adminAPI = {
    getDashboardStats: () => API.get('/admin/dashboard'),
    getAnalytics: () => API.get('/admin/analytics'),

    // User Management
    getUsers: (params) => API.get('/admin/users', { params }),
    createUser: (data) => API.post('/admin/users', data),
    updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
    deleteUser: (id) => API.delete(`/admin/users/${id}`),

    // Task Management
    getTasks: (params) => API.get('/admin/tasks', { params }),
    getUnassignedTasks: (params) => API.get('/admin/tasks/unassigned', { params }),
    createTask: (data) => API.post('/admin/tasks', data),
    updateTask: (id, data) => API.put(`/admin/tasks/${id}`, data),
    getStaffPerformance: (id) => API.get(`/manager/performance/${id}`) // Reusing manager route for now if needed or add admin one
};

// Manager API
export const managerAPI = {
    getDashboard: () => API.get('/manager/dashboard'),
    getTeam: (params) => API.get('/manager/team', { params }),
    assignTask: (data) => API.post('/manager/tasks/assign', data),
    getUnassignedTasks: () => API.get('/manager/tasks/unassigned'),
    addStaff: (data) => API.post('/manager/team', data),
    getDepartmentTasks: (params) => API.get('/manager/tasks', { params }),
    getTaskDetails: (id) => API.get(`/manager/tasks/${id}`),
    getPerformance: () => API.get('/manager/performance'),
    getStaffPerformance: (id) => API.get(`/manager/performance/${id}`)
};

// Staff API
export const staffAPI = {
    getDashboard: () => API.get('/staff/dashboard'),
    getMyTasks: (params) => API.get('/staff/tasks', { params }),
    updateTaskProgress: (id, data) => API.put(`/staff/tasks/${id}/progress`, data),
    addComment: (id, data) => API.post(`/staff/tasks/${id}/comments`, data),
    getNotifications: () => API.get('/staff/notifications'),
    markNotificationRead: (id) => API.put(`/staff/notifications/${id}/read`)
};

// Notification API
export const notificationAPI = {
    getAll: () => API.get('/notifications'),
    markAsRead: (id) => API.put(`/notifications/${id}/read`),
    markAllAsRead: () => API.put('/notifications/read-all'),
    unreadCount: () => API.get('/notifications/unread-count')
};

// General/Shared API
export const sharedAPI = {
    getNotifications: () => API.get('/notifications'),
    markAllNotificationsRead: () => API.put('/notifications/read-all'),
    getReports: (params) => API.get('/admin/reports/tasks', { params }), // Default to task reports
    getTaskStatus: (params) => API.get('/tasks', { params })
};

export default API;