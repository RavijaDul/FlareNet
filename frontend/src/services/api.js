// services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Auth API
// export const authAPI = {
//   register: (data) => api.post('/auth/register', data),
//   login: (data) => api.post('/auth/login', data),
//   promote: (id) => api.post(`/auth/promote/${id}`), // only admins
// };

// // attach token if exists
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// Transformers API
export const transformersAPI = {
  list: () => api.get('/transformers'),
  create: (data) => api.post('/transformers', data),
  get: (id) => api.get(`/transformers/${id}`),
  update: (id, data) => api.put(`/transformers/${id}`, data),
  delete: (id) => api.delete(`/transformers/${id}`),
};

// Inspections API
export const inspectionsAPI = {
  getByTransformer: (transformerId) => api.get(`/inspections/transformer/${transformerId}`),
  create: (data) => api.post('/inspections', data),
  get: (id) => api.get(`/inspections/${id}`),
  update: (id, data) => api.put(`/inspections/${id}`, data),
  delete: (id) => api.delete(`/inspections/${id}`),
};

// Images API
export const imagesAPI = {
  list: (transformerId) => api.get(`/transformers/${transformerId}/images`),
  upload: (transformerId, formData) => api.post(`/transformers/${transformerId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  // --- NEW API CALLS ---
  getBaseline: (transformerId) => api.get(`/transformers/${transformerId}/images/baseline`),
  getMaintenanceByInspection: (transformerId, inspectionId) => api.get(`/transformers/${transformerId}/images/inspection/${inspectionId}/maintenance`),
  deleteBaseline: (transformerId) => api.delete(`/transformers/${transformerId}/images/baseline`),
  deleteImage: (transformerId, imageId) => api.delete(`/transformers/${transformerId}/images/${imageId}`),

};

// Annotations API
export const annotationsAPI = {
  get: (thermalImageId) => api.get(`/annotations/image/${thermalImageId}`),
  save: (thermalImageId, userId, annotationsJson) => api.post(`/annotations/image/${thermalImageId}`, annotationsJson, {
    params: { userId },
    headers: {
      'Content-Type': 'application/json',
    },
  }),
};

// Maintenance records API
export const maintenanceAPI = {
  // Save a maintenance record for an inspection
  saveForInspection: (inspectionId, transformerId, userId, recordJson) =>
    api.post(`/inspections/${inspectionId}/maintenance-records`, recordJson, {
      params: { transformerId, userId },
      headers: { 'Content-Type': 'application/json' },
    }),

  // Get records for an inspection
  getByInspection: (inspectionId) => api.get(`/inspections/${inspectionId}/maintenance-records`),

  // Get records for transformer + inspection
  getByTransformerAndInspection: (transformerId, inspectionId) =>
    api.get(`/transformers/${transformerId}/inspections/${inspectionId}/maintenance-records`),
};
export default api;


// import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8080/api';

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Transformers API
// export const transformersAPI = {
//   list: () => api.get('/transformers'),
//   create: (data) => api.post('/transformers', data),
//   get: (id) => api.get(`/transformers/${id}`),
//   update: (id, data) => api.put(`/transformers/${id}`, data),
//   delete: (id) => api.delete(`/transformers/${id}`),
// };

// // Inspections API
// export const inspectionsAPI = {
//   getByTransformer: (transformerId) => api.get(`/inspections/transformer/${transformerId}`),
//   create: (data) => api.post('/inspections', data),
//   get: (id) => api.get(`/inspections/${id}`),
//   update: (id, data) => api.put(`/inspections/${id}`, data),
//   delete: (id) => api.delete(`/inspections/${id}`),
// };

// // Images API
// export const imagesAPI = {
//   list: (transformerId) => api.get(`/transformers/${transformerId}/images`),
//   upload: (transformerId, formData) => api.post(`/transformers/${transformerId}/images`, formData, {
//     headers: {
//       'Content-Type': 'multipart/form-data',
//     },
//   }),
// };
