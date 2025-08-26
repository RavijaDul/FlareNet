# FlareNet Frontend-Backend Integration Plan

## Backend API Endpoints Available

### Transformers
- `GET /api/transformers` - List all transformers
- `POST /api/transformers` - Create new transformer
- `GET /api/transformers/{id}` - Get specific transformer
- `PUT /api/transformers/{id}` - Update transformer
- `DELETE /api/transformers/{id}` - Delete transformer

### Inspections
- `GET /api/inspections/transformer/{transformerId}` - Get inspections for transformer
- `POST /api/inspections` - Create new inspection
- `GET /api/inspections/{id}` - Get specific inspection
- `PUT /api/inspections/{id}` - Update inspection
- `DELETE /api/inspections/{id}` - Delete inspection

### Images
- `GET /api/transformers/{transformerId}/images` - List images for transformer
- `POST /api/transformers/{transformerId}/images` - Upload image (multipart/form-data)

## Required Frontend Changes

### 1. Install Dependencies
```bash
npm install axios
```

### 2. Create API Service (src/services/api.js)
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
};
```

### 3. Update Components

#### TransformerInfo.jsx (NewPage)
- Replace local `transformersData` state with API calls
- Update CRUD operations to use `transformersAPI`
- Add loading states and error handling

#### Transformer.jsx
- Fix image upload to use `imagesAPI.upload()`
- Use correct parameter names (`imageType` instead of `tag`)
- Add proper error handling for uploads

#### TransformerDetails.jsx
- Replace local `inspectionData` with API calls to `inspectionsAPI.getByTransformer()`
- Implement CRUD operations for inspections using API

### 4. Error Handling
- Add try-catch blocks for all API calls
- Implement user-friendly error messages
- Add loading states

### 5. Testing
- Test all API endpoints work correctly
- Verify CORS configuration (already set in backend controllers)
- Test error scenarios

## Backend Configuration
- Ensure backend runs on port 8080 (default Spring Boot port)
- CORS is already configured in controllers for `http://localhost:5173`

## Implementation Priority
1. Install axios and create API service
2. Update TransformerInfo.jsx (main transformers list)
3. Update TransformerDetails.jsx (inspections)
4. Update Transformer.jsx (image uploads)
5. Add comprehensive error handling
