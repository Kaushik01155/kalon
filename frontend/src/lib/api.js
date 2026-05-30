import { getApiBase } from './config';

function getToken() {
  return localStorage.getItem('kalon_token');
}

export async function api(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${getApiBase()}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const authApi = {
  sendOtp: (phone) => api('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (body) => api('/auth/verify-otp', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
};

export const vehicleApi = {
  list: () => api('/vehicles'),
  create: (data) => api('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => api(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => api(`/vehicles/${id}`, { method: 'DELETE' }),
};

export const serviceApi = {
  list: () => api('/services'),
};

export const requestApi = {
  create: (data) => api('/requests', { method: 'POST', body: JSON.stringify(data) }),
  my: () => api('/requests/my'),
  get: (id) => api(`/requests/${id}`),
  updateStatus: (id, data) => api(`/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateLocation: (id, data) => api(`/requests/${id}/location`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const paymentApi = {
  create: (data) => api('/payments/create', { method: 'POST', body: JSON.stringify(data) }),
  confirm: (data) => api('/payments/confirm', { method: 'POST', body: JSON.stringify(data) }),
  history: () => api('/payments/history'),
};

export const volunteerApi = {
  dashboard: () => api('/volunteer/dashboard'),
  setAvailability: (is_available) =>
    api('/volunteer/availability', { method: 'PATCH', body: JSON.stringify({ is_available }) }),
  setLocation: (latitude, longitude) =>
    api('/volunteer/location', { method: 'PATCH', body: JSON.stringify({ latitude, longitude }) }),
};

export const adminApi = {
  dashboard: () => api('/admin/dashboard'),
  users: () => api('/admin/users'),
};
