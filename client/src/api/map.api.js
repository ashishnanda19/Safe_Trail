import api from './axios';

export const getNearbyPlaces = (params) => api.get('/map/nearby', { params }).then(r => r.data.data);
export const getNearestPlace = (params) => api.get('/map/nearest', { params }).then(r => r.data.data);
export const getRoute = (params) => api.get('/map/route', { params }).then(r => r.data.data);
export const reverseGeocode = (params) => api.get('/map/geocode/reverse', { params }).then(r => r.data.data);
export const getLivePings = (sosEventId) => api.get(`/map/live/${sosEventId}`).then(r => r.data.data);
export const getLatestLivePing = (sosEventId) => api.get(`/map/live/${sosEventId}/latest`).then(r => r.data.data);
export const getHeatmap = (params) => api.get('/map/heatmap', { params }).then(r => r.data.data);
