const API_BASE_URL = 'http://localhost:8080/api';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Transformer API service
export const transformerAPI = {
  // Get all transformers
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/transformers`);
    return handleResponse(response);
  },

  // Get transformer by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/transformers/${id}`);
    return handleResponse(response);
  },

  // Create new transformer
  create: async (transformerData) => {
    const response = await fetch(`${API_BASE_URL}/transformers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformerData),
    });
    return handleResponse(response);
  },

  // Update transformer
  update: async (id, transformerData) => {
    const response = await fetch(`${API_BASE_URL}/transformers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transformerData),
    });
    return handleResponse(response);
  },

  // Delete transformer
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/transformers/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }
    return true;
  },
};

// Inspection API service
export const inspectionAPI = {
  // Get inspections by transformer ID
  getByTransformerId: async (transformerId) => {
    const response = await fetch(`${API_BASE_URL}/inspections/transformer/${transformerId}`);
    return handleResponse(response);
  },

  // Get inspection by ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inspections/${id}`);
    return handleResponse(response);
  },

  // Create new inspection
  create: async (inspectionData) => {
    const response = await fetch(`${API_BASE_URL}/inspections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inspectionData),
    });
    return handleResponse(response);
  },

  // Update inspection
  update: async (id, inspectionData) => {
    const response = await fetch(`${API_BASE_URL}/inspections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inspectionData),
    });
    return handleResponse(response);
  },

  // Delete inspection
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/inspections/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }
    return true;
  },
};
