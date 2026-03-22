import api from './axios';

export const getMe = () => api.get('/users/me').then(r => r.data.data);
export const updateMe = (data) => api.patch('/users/me', data).then(r => r.data.data);
export const updateLocation = (data) => api.patch('/users/me/location', data).then(r => r.data.data);
