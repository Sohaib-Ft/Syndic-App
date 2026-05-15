import axios from 'axios';

const API_URL = '/api';

const api = axios.create({ baseURL: API_URL });

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur pour gérer les erreurs d'auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
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

// ==================== ANNONCES ====================
export const annonceAPI = {
  getAll: () => api.get('/annonces'),
  getById: (id) => api.get(`/annonces/${id}`),
  create: (data) => api.post('/annonces', data),
  update: (id, data) => api.put(`/annonces/${id}`, data),
  delete: (id) => api.delete(`/annonces/${id}`),
};

// ==================== CHARGES ====================
export const chargeAPI = {
  getAll: (params) => api.get('/charges', { params }),
  create: (data) => api.post('/charges', data),
  update: (id, data) => api.put(`/charges/${id}`, data),
  delete: (id) => api.delete(`/charges/${id}`),
  stats: (annee) => api.get('/charges/stats', { params: { annee } }),
};

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  syndic: () => api.get('/dashboard/syndic'),
  resident: () => api.get('/dashboard/resident'),
};

export default api;
