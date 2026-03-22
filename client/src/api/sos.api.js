import api from './axios';

export const triggerSOS = (data) => api.post('/sos/trigger', data).then(r => r.data.data);
export const addPing = (eventId, data) => api.post(`/sos/${eventId}/location`, data).then(r => r.data.data);
export const getLatestPing = (eventId) => api.get(`/sos/${eventId}/location`).then(r => r.data.data);
export const resolveSOS = (eventId, data) => api.patch(`/sos/${eventId}/resolve`, data || {}).then(r => r.data.data);
export const getSosHistory = (params) => api.get('/sos/history', { params }).then(r => r.data);
