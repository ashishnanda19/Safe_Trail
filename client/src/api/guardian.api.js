import api from './axios';

export const listGuardians = () => api.get('/guardians').then(r => r.data.data.guardians);
export const listInvites = () => api.get('/guardians/invites').then(r => r.data.data.invites);
export const addGuardian = (phone) => api.post('/guardians', { phone }).then(r => r.data.data);
export const acceptInvite = (circleId) => api.patch(`/guardians/${circleId}/accept`).then(r => r.data.data);
export const removeGuardian = (guardianId) => api.delete(`/guardians/${guardianId}`);
