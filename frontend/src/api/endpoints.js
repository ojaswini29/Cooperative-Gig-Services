import apiClient from './client';

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
};

export const workerAPI = {
  getProfile: () => apiClient.get('/workers/me'),
  updateProfile: (data) => apiClient.put('/workers/profile', data),
  updateLocation: (data) => apiClient.put('/workers/location', data),
  addSkill: (data) => apiClient.post('/workers/skills', data),
  removeSkill: (skillId) => apiClient.delete(`/workers/skills/${skillId}`),
  getPendingWorkers: (status = 'pending') => apiClient.get(`/workers/pending?status=${status}`),
  verifyWorker: (id, data) => apiClient.patch(`/workers/${id}/verify`, data),
};

export const catalogAPI = {
  getCategories: () => apiClient.get('/categories'),
  getCategoryById: (id) => apiClient.get(`/categories/${id}`),
  createCategory: (data) => apiClient.post('/categories', data),
  updateCategory: (id, data) => apiClient.put(`/categories/${id}`, data),
  deleteCategory: (id) => apiClient.delete(`/categories/${id}`),
  getSkills: (categoryId) => apiClient.get(categoryId ? `/skills?category_id=${categoryId}` : '/skills'),
  createSkill: (data) => apiClient.post('/skills', data),
  updateSkill: (id, data) => apiClient.put(`/skills/${id}`, data),
  deleteSkill: (id) => apiClient.delete(`/skills/${id}`),
};

export const bookingAPI = {
  createBooking: (data) => apiClient.post('/bookings', data),
  getBookings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/bookings${query ? `?${query}` : ''}`);
  },
  getBookingById: (id) => apiClient.get(`/bookings/${id}`),
  cancelBooking: (id) => apiClient.patch(`/bookings/${id}/cancel`),
};

export const matchAPI = {
  findNearbyWorkers: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/match/workers?${query}`);
  },
  matchBooking: (bookingId, maxDist = 25) => apiClient.get(`/match/booking/${bookingId}?max_distance_km=${maxDist}`),
  scoreWorkers: (bookingId, maxDist = 30) => apiClient.get(`/allocation/score/${bookingId}?max_distance_km=${maxDist}`),
  autoAssign: (bookingId) => apiClient.post(`/allocation/auto-assign/${bookingId}`),
};

export const jobAPI = {
  getMyJobs: (status) => apiClient.get(`/jobs/my-jobs${status ? `?status=${status}` : ''}`),
  acceptJob: (bookingId) => apiClient.post(`/jobs/${bookingId}/accept`),
  startJob: (bookingId) => apiClient.post(`/jobs/${bookingId}/start`),
  completeJob: (bookingId, data) => apiClient.post(`/jobs/${bookingId}/complete`, data),
};

export const paymentAPI = {
  getInvoiceById: (id) => apiClient.get(`/invoices/${id}`),
  getInvoiceByBooking: (bookingId) => apiClient.get(`/invoices/booking/${bookingId}`),
  processPayment: (data) => apiClient.post('/payments/process', data),
};

export const ratingAPI = {
  createRating: (data) => apiClient.post('/ratings', data),
  getWorkerRatings: (workerId) => apiClient.get(`/ratings/worker/${workerId}`),
  getBookingRatings: (bookingId) => apiClient.get(`/ratings/booking/${bookingId}`),
};

export const welfareAPI = {
  getWorkerWelfareStatus: () => apiClient.get('/welfare/worker/status'),
  submitClaim: (data) => apiClient.post('/welfare/claims', data),
  getClaims: (status) => apiClient.get(`/welfare/claims${status ? `?status=${status}` : ''}`),
  updateClaimStatus: (id, data) => apiClient.patch(`/welfare/claims/${id}/status`, data),
  getWelfareSummary: () => apiClient.get('/welfare/summary'),
};

export const forecastAPI = {
  getDemandFeatures: (days = 90, categoryId = '') => apiClient.get(`/forecasting/demand-features?days=${days}${categoryId ? `&category_id=${categoryId}` : ''}`),
  getPredictiveDemand: (horizonDays = 7, categoryId = '') => apiClient.get(`/forecasting/predict?forecast_horizon_days=${horizonDays}${categoryId ? `&category_id=${categoryId}` : ''}`),
};

export const adminAPI = {
  getDashboardStats: () => apiClient.get('/admin/dashboard'),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/admin/users${query ? `?${query}` : ''}`);
  },
  updateUserStatus: (id, data) => apiClient.patch(`/admin/users/${id}/status`, data),
};
