// utils/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined'
            ? (sessionStorage.getItem('token') || localStorage.getItem('token'))
            : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        if (error.response?.status === 403) {
            if (typeof window !== 'undefined') {
                window.location.href = '/not-found';
            }
        }
        if (error.response?.status === 500) {
            console.error('Server Error:', error.response.data);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

export const api = {
    get: (url, config) => axiosInstance.get(url, config),
    post: (url, data, config) => axiosInstance.post(url, data, config),
    put: (url, data, config) => axiosInstance.put(url, data, config),
    patch: (url, data, config) => axiosInstance.patch(url, data, config),
    delete: (url, config) => axiosInstance.delete(url, config),
};
