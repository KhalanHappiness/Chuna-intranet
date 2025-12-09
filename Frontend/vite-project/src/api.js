import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const register = (username, email, password) => {
  return api.post('/register', { username, email, password });
};

export const login = (username, password) => {
  return api.post('/login', { username, password });
};

// Repositories
export const getRepositories = () => {
  return api.get('/repositories');
};

export const createRepository = (name, description, type) => {
  return api.post('/repositories', { name, description, type });
};

export const getRepository = (id) => {
  return api.get(`/repositories/${id}`);
};

// File Upload
export const uploadFile = (repositoryId, file, tags) => {
  const formData = new FormData();
  formData.append('file', file);
  if (tags) {
    formData.append('tags', tags);
  }

  return api.post(`/repositories/${repositoryId}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Share Links
export const createShareLink = (repositoryId, permission, expiresInDays) => {
  return api.post(`/repositories/${repositoryId}/share`, {
    permission,
    expires_in_days: expiresInDays,
  });
};

export const getSharedRepository = (token) => {
  return axios.get(`${API_BASE_URL}/share/${token}`);
};

// Meetings
export const createMeeting = (repositoryId, title, platform, meetingUrl, scheduledAt) => {
  return api.post(`/repositories/${repositoryId}/meetings`, {
    title,
    platform,
    meeting_url: meetingUrl,
    scheduled_at: scheduledAt,
  });
};

// File Download
export const downloadFile = (fileId) => {
  return api.get(`/files/${fileId}/download`, {
    responseType: 'blob',
  });
};

export default api;