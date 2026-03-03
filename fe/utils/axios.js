// lib/axios.js
import axios from 'axios';
import { useState } from 'react';

// Debug log để kiểm tra env


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
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || sessionStorage.getItem("token")
        : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData, let axios handle it automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    if (process.env.NODE_ENV === 'development') {

    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {

    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
    }

    // Xử lý lỗi chung
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Chỉ redirect khi user đã từng đăng nhập (có token) => token hết hạn
        // Không redirect nếu user là khách (chưa đăng nhập)
        const hadToken = localStorage.getItem("token") || sessionStorage.getItem("token");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        if (hadToken) {
          window.location.href = '/login';
        }
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

// Export các method thường dùng
export const api = {
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  patch: (url, data, config) => axiosInstance.patch(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),

  // Review API methods
  reviews: {
    // Create a new review
    create: (reviewData) => axiosInstance.post('/reviews', reviewData),

    // Get all reviews
    getAll: () => axiosInstance.get('/reviews'),

    // Get reviews for a specific product
    getByProduct: (productId) => axiosInstance.get(`/reviews/product/${productId}`),

    // Get unreviewed products for a user
    getUnreviewed: (productId) => axiosInstance.get(`/reviews/unreviewed/${productId}`),

    // Update a review
    update: (reviewId, reviewData) => axiosInstance.put(`/reviews/${reviewId}`, reviewData),

    // Delete a review
    delete: (reviewId) => axiosInstance.delete(`/reviews/${reviewId}`),
  },

  // Attribute API methods
  attributes: {
    // Get attributes by categoryId (single or multiple)
    getByCategory: (categoryIds) => {
      // categoryIds: string or array of strings
      if (Array.isArray(categoryIds)) {
        // Join multiple IDs for query param
        return axiosInstance.get(`/attributes?categoryId=${categoryIds.join(',')}`);
      } else {
        return axiosInstance.get(`/attributes?categoryId=${categoryIds}`);
      }
    },
  },
};

// Utility functions cho các trường hợp đặc biệt
export const apiUtils = {
  // Upload file
  uploadFile: (url, file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return axiosInstance.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  // Download file
  downloadFile: async (url, filename) => {
    try {
      const response = await axiosInstance.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },

  // Create review
  createReview: async (reviewData) => {
    try {
      const response = await axiosInstance.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      console.error('Create review failed:', error);
      throw error;
    }
  },
};

// Custom hooks cho React components
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = async (apiCall) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiCall();
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading, error };
};