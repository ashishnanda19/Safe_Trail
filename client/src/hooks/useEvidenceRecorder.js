import { useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

const CHUNK_DURATION_MS = 30000; // 30 seconds per chunk

/**
 * useEvidenceRecorder — silently records audio when SOS is active.
 * Uploads 30-second chunks to /api/evidence/:sosEventId/chunk.
 * Fails silently — evidence recording must NEVER interrupt the SOS flow.
 *
 * @param {string|null} sosEventId — the active SOS event ID
 * @returns {{ isRecording: boolean }}
 */
export const useEvidenceRecorder = (sosEventId) => {
  const mediaRecorderRef = useRef(null);
  const streamRef        = useRef(null);
  const chunkIndexRef    = useRef(0);
  const isRecordingRef   = useRef(false);

  const uploadChunk = async (blob, index) => {
    if (!sosEventId || blob.size < 1000) return; // skip tiny/empty blobs

    const formData = new FormData();
    formData.append('chunk', blob, `chunk_${index}.webm`);
    formData.append('chunkIndex', String(index));
    formData.append('durationSecs', String(Math.round(CHUNK_DURATION_MS / 1000)));

    try {
      await api.post(`/evidence/${sosEventId}/chunk`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      // Silently fail — evidence recording must never interrupt SOS flow
      console.warn('[EvidenceRecorder] Chunk upload failed:', err.message);
    }
  };

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    if (!sosEventId) return;

    try {
      // Audio only — less data, still captures voices around user
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false },
        video: false,
      });

      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 32000, // low bitrate — smaller files
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          uploadChunk(event.data, chunkIndexRef.current++);
        }
      };

      // Request a chunk every 30 seconds
      recorder.start(CHUNK_DURATION_MS);
      mediaRecorderRef.current = recorder;
      isRecordingRef.current   = true;
    } catch (err) {
      // Microphone permission denied or not available — fail silently
      // SOS still works without evidence recording
      console.warn('[EvidenceRecorder] Recording unavailable:', err.message);
    }
  }, [sosEventId]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop(); // triggers final ondataavailable
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    isRecordingRef.current = false;
    chunkIndexRef.current  = 0;
  }, []);

  // Auto-start when sosEventId appears, auto-stop when it clears
  useEffect(() => {
    if (sosEventId) {
      startRecording();
    } else {
      stopRecording();
    }
    return () => stopRecording();
  }, [sosEventId, startRecording, stopRecording]);

  return { isRecording: isRecordingRef.current };
};
