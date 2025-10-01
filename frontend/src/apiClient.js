// frontend/src/apiClient.js

import axios from 'axios';

// Get the base API URL from the environment variables.
// In development, this might fall back to a local URL.
// In production (Vercel/Netlify), it will use the VITE_API_URL set in the build environment.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 💡 Interceptor to add the JWT token to every request automatically
apiClient.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default apiClient;