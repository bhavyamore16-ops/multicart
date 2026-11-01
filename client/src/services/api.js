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
      const error = new Error(data.message || `HTTP Error ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
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
  getSalesReport:()        => apiRequest('/vendor/sales-report'),

  // Image upload — sends multipart/form-data (bypasses JSON Content-Type)
  uploadImage: async (file) => {
    const token = localStorage.getItem('multicart_token');
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API_BASE_URL}/vendor/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Upload failed');
    return data;
  },

  // Admin
  getAllAdmin:  ()          => apiRequest('/admin/products'),
  updateAdmin:  (id, data)  => apiRequest(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  removeAdmin:  (id)        => apiRequest(`/admin/products/${id}`, { method: 'DELETE' })
};

export const cartAPI = {
  get: () => apiRequest('/cart'),
  add: (productId, quantity = 1) => apiRequest('/cart/items', {
    method: 'POST', body: JSON.stringify({ productId, quantity })
  }),
  update: (productId, quantity) => apiRequest(`/cart/items/${productId}`, {
    method: 'PATCH', body: JSON.stringify({ quantity })
  }),
  remove: (productId) => apiRequest(`/cart/items/${productId}`, { method: 'DELETE' }),
  clear: () => apiRequest('/cart', { method: 'DELETE' }),
  merge: (items) => apiRequest('/cart/merge', { method: 'POST', body: JSON.stringify({ items }) }),
  validate: () => apiRequest('/cart/validate', { method: 'POST', body: JSON.stringify({}) })
};

export const wishlistAPI = {
  get: () => apiRequest('/wishlist'),
  add: (productId) => apiRequest('/wishlist/items', { method: 'POST', body: JSON.stringify({ productId }) }),
  remove: (productId) => apiRequest(`/wishlist/items/${productId}`, { method: 'DELETE' })
};

export const orderAPI = {
  checkoutOptions: () => apiRequest('/checkout/options'),
  checkout: (data) => apiRequest('/checkout', { method: 'POST', body: JSON.stringify(data) }),
  verifyPayment: (data) => apiRequest('/checkout/verify', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => apiRequest('/orders'),
  getOrder: (id) => apiRequest(`/orders/${id}`),
  cancel: (id) => apiRequest(`/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) }),
  vendorDecision: (id, action, reason = '') => apiRequest(`/orders/${id}/decision`, {
    method: 'POST', body: JSON.stringify({ action, reason })
  }),
  updateVendorStatus: (id, data) => apiRequest(`/orders/${id}/status`, {
    method: 'PATCH', body: JSON.stringify(data)
  }),
  getAdminOrders: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/orders${qs ? `?${qs}` : ''}`);
  },
  getAdminTransactions: () => apiRequest('/admin/orders/transactions'),
  updateAdminStatus: (id, data) => apiRequest(`/admin/orders/${id}/status`, {
    method: 'PATCH', body: JSON.stringify(data)
  })
};

// ── Category API ──────────────────────────────────────────────────────────────
export const categoryAPI = {
  getAll: () => apiRequest('/categories'),
  getAllAdmin: () => apiRequest('/admin/categories'),
  create: (data) => apiRequest('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' })
};

export const adminAPI = {
  getOverview: () => apiRequest('/admin/overview'),
  getReports: () => apiRequest('/admin/reports'),
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  toggleUserStatus: (id) => apiRequest(`/admin/users/${id}/toggle-status`, { method: 'PUT', body: JSON.stringify({}) }),
  getVendors: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/vendors${qs ? `?${qs}` : ''}`);
  },
  updateVendorStatus: (id, data) => apiRequest(`/admin/vendors/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  getMessages: () => apiRequest('/admin/messages'),
  updateMessage: (id, data) => apiRequest(`/admin/messages/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMessage: (id) => apiRequest(`/admin/messages/${id}`, { method: 'DELETE' })
};

export const reviewAPI = {
  get: (productId) => apiRequest(`/products/${productId}/reviews`),
  getEligibility: (productId) => apiRequest(`/reviews/products/${productId}/eligibility`),
  create: (productId, data) => apiRequest(`/products/${productId}/reviews`, { method: 'POST', body: JSON.stringify(data) })
};

export const notificationAPI = {
  getAll: () => apiRequest('/notifications'),
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH', body: JSON.stringify({}) }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PATCH', body: JSON.stringify({}) })
};

export const contactAPI = {
  send: (data) => apiRequest('/contact/messages', { method: 'POST', body: JSON.stringify(data) }),
  getMyMessages: () => apiRequest('/contact/messages/mine')
};

export const vendorAPI = {
  getProfile: () => apiRequest('/vendor/profile'),
  updateProfile: (data) => apiRequest('/vendor/profile', { method: 'PUT', body: JSON.stringify(data) })
};
