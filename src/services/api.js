import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

const buildFullPath = (baseURL, relativeURL) => {
  if (!baseURL) return relativeURL;
  if (relativeURL.startsWith('http://') || relativeURL.startsWith('https://')) {
    return relativeURL;
  }
  const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  const cleanRelative = relativeURL.startsWith('/') ? relativeURL.substring(1) : relativeURL;
  return `${cleanBase}/${cleanRelative}`;
};

// Intercepteur pour ajouter le token JWT et combiner les URLs de manière robuste
api.interceptors.request.use((config) => {
  if (config.baseURL) {
    config.url = buildFullPath(config.baseURL, config.url);
    config.baseURL = ''; // Reset baseURL pour éviter une double concaténation
  }
  const token = localStorage.getItem('token');
  const lang = localStorage.getItem('syndic_lang');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (lang) config.headers['x-lang'] = lang;
  return config;
});

// Intercepteur pour gérer les erreurs d'auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/google') || error.config?.url?.includes('/auth/register');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ====================
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  googleLogin: (token) => api.post('/auth/google', { token }),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ==================== APPARTEMENTS ====================
export const appartementAPI = {
  getAll: () => api.get('/appartements'),
  getById: (id) => api.get(`/appartements/${id}`),
  create: (data) => api.post('/appartements', data),
  update: (id, data) => api.put(`/appartements/${id}`, data),
  delete: (id) => api.delete(`/appartements/${id}`),
};

// ==================== RÉSIDENTS ====================
export const residentAPI = {
  getAll: () => api.get('/residents'),
  getById: (id) => api.get(`/residents/${id}`),
  create: (data) => api.post('/residents', data),
  update: (id, data) => api.put(`/residents/${id}`, data),
  delete: (id) => api.delete(`/residents/${id}`),
  getPaiements: (id) => api.get(`/residents/${id}/paiements`),
};

// ==================== PAIEMENTS ====================
export const paiementAPI = {
  getAll: (params) => api.get('/paiements', { params }),
  create: (data) => api.post('/paiements', data),
  valider: (id) => api.put(`/paiements/${id}/valider`),
  statsMensuel: () => api.get('/paiements/stats/mensuel'),
  statsAnnuel: (annee) => api.get('/paiements/stats/annuel', { params: { annee } }),
  generer: (data) => api.post('/paiements/generer', data),
};

// ==================== CHARGES ====================
export const chargeAPI = {
  getAll: (params) => api.get('/charges', { params }),
  create: (data) => api.post('/charges', data),
  update: (id, data) => api.put(`/charges/${id}`, data),
  delete: (id) => api.delete(`/charges/${id}`),
  stats: (annee) => api.get('/charges/stats', { params: { annee } }),
};

// ==================== CHARGES RÉSIDENTS ====================
export const residentChargeAPI = {
  getPartielles: () => api.get('/resident-charges/partielles'),
  createPartielle: (data) => api.post('/resident-charges/partielles', data),
  updatePartielle: (id, data) => api.put(`/resident-charges/partielles/${id}`, data),
  deletePartielle: (id) => api.delete(`/resident-charges/partielles/${id}`),
  validerPartielle: (chargeId, residentId) => api.post(`/resident-charges/partielles/${chargeId}/valider/${residentId}`),
  getEssentielle: () => api.get('/resident-charges/essentielle'),
  updateEssentielle: (value) => api.put('/resident-charges/essentielle', { value }),
  getMesCharges: () => api.get('/resident-charges/mes-charges'),
};

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  syndic: () => api.get('/dashboard/syndic'),
  resident: () => api.get('/dashboard/resident'),
};

export default api;
