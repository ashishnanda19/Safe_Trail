import api from './axios';

export const getAdminStats = () => api.get('/admin/stats').then(r => r.data.data);
export const getActiveSOS = () => api.get('/admin/sos/active').then(r => r.data.data);
export const getAdminHeatmap = (params) => api.get('/admin/heatmap', { params }).then(r => r.data.data);
export const updateUserRole = (id, role) => api.patch(`/admin/users/${id}/role`, { role }).then(r => r.data.data);
