import api from './axios';

export const login = (data) => api.post('/auth/login', data).then(r => r.data.data);
export const register = (data) => api.post('/auth/register', data).then(r => r.data.data);
export const refresh = (refreshToken) => api.post('/auth/refresh', { refreshToken }).then(r => r.data.data);
export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken });
