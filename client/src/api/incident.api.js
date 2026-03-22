import api from './axios';

export const getNearbyIncidents = (params) => api.get('/incidents/nearby', { params }).then(r => r.data.data);
export const reportIncident = (data) => api.post('/incidents', data).then(r => r.data.data);
export const getIncident = (id) => api.get(`/incidents/${id}`).then(r => r.data.data);
