import api from './axios';

export const listEvidenceChunks = (sosEventId) =>
  api.get(`/evidence/${sosEventId}`).then(r => r.data.data);

import { useAuthStore } from '@/store/authStore';

/**
 * Returns the URL for streaming a specific audio chunk.
 * Used directly as the <audio src> — the browser streams via the backend.
 * We attach the auth token from the global store as a query parameter.
 */
export const getEvidenceChunkStreamUrl = (sosEventId, chunkId) => {
  const token = useAuthStore.getState().accessToken;
  return `/api/evidence/${sosEventId}/chunk/${chunkId}?token=${token}`;
};
