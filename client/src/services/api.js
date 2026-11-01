const API_BASE_URL = 'http://localhost:5000/api';

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('multicart_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP Error ${response.status}`);
    }
    return data;
  } catch (error) {
    console.warn(`[API] Error on ${endpoint}:`, error.message);
    throw error;
  }
};

// ── Product API ───────────────────────────────────────────────────────────────
export const productAPI = {
  getAll:    (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/products${qs ? '?' + qs : ''}`);
  },
  getById:   (idOrSlug)    => apiRequest(`/products/${idOrSlug}`),

  // Vendor CRUD
  getMyProducts: ()        => apiRequest('/vendor/products'),
  create:        (data)    => apiRequest('/vendor/products', { method: 'POST', body: JSON.stringify(data) }),
  update:        (id, data)=> apiRequest(`/vendor/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove:        (id)      => apiRequest(`/vendor/products/${id}`, { method: 'DELETE' }),
  getStats:      ()        => apiRequest('/vendor/stats'),

  // Admin
  getAllAdmin:  ()          => apiRequest('/admin/products')
};

// ── Category API ──────────────────────────────────────────────────────────────
export const categoryAPI = {
  getAll: () => apiRequest('/categories'),
  create: (data) => apiRequest('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' })
};
