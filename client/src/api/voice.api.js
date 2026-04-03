import api from './axios';

export const getVoiceSettings = () =>
  api.get('/voice/settings').then(r => r.data.data);

export const updateVoiceSettings = (data) =>
  api.put('/voice/settings', data).then(r => r.data.data);

export const getVoiceKeywords = () =>
  api.get('/voice/keywords').then(r => r.data.data);

export const addVoiceKeyword = (keyword, language = 'en-IN') =>
  api.post('/voice/keywords', { keyword, language }).then(r => r.data.data);

export const removeVoiceKeyword = (id) =>
  api.delete(`/voice/keywords/${id}`).then(r => r.data);
