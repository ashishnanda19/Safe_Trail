import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSosStore } from '../store/sosStore';
import { useGeolocation } from './useGeolocation';
import api from '../api/axios';
import toast from 'react-hot-toast';

// Lowered thresholds significantly because Web Speech API often gives very low confidence for short words like "help"
const CONFIDENCE_THRESHOLDS = { low: 0.1, medium: 0.4, high: 0.7 };

/**
 * useVoiceSOS — continuously listens for voice keywords using the Web Speech API.
 * When a keyword is detected above the confidence threshold, fires the voice SOS pipeline.
 *
 * @param {object} settings — { is_enabled, sensitivity, keywords: [{keyword, ...}] }
 * @returns {{ isListening: boolean }}
 */
export const useVoiceSOS = (settings) => {
  const navigate = useNavigate();
  const recognitionRef  = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const cooldownRef     = useRef(false);
  
  const { lat, lng }    = useGeolocation();
  const latRef = useRef(lat);
  const lngRef = useRef(lng);
  useEffect(() => { latRef.current = lat; }, [lat]);
  useEffect(() => { lngRef.current = lng; }, [lng]);

  const activeSosId     = useSosStore(s => s.activeSosId);
  const activeSosIdRef  = useRef(activeSosId);
  useEffect(() => { activeSosIdRef.current = activeSosId; }, [activeSosId]);

  const keywordsArray = (settings?.keywords ?? []).map(k => (typeof k === 'string' ? k.toLowerCase() : k.keyword.toLowerCase()));
  const keywordsString = keywordsArray.join(',');
  
  const enabled     = settings?.is_enabled ?? false;
  const sensitivity = settings?.sensitivity ?? 'medium';
  const threshold   = CONFIDENCE_THRESHOLDS[sensitivity];

  const handleVoiceTrigger = useCallback(async (keyword, confidence) => {
    const currentLat = latRef.current;
    const currentLng = lngRef.current;
    if (!currentLat || !currentLng) {
      console.warn('Voice SOS triggered but waiting for location...');
      return;
    }

    try {
      const res = await api.post('/voice/trigger', {
        latitude:        currentLat,
        longitude:       currentLng,
        detectedKeyword: keyword,
        confidence,
      });

      // Activate SOS in the store — the router/persistent bar will pick this up
      useSosStore.getState().setActive({
        sosEventId:    res.data.data.sosEventId,
        triggeredAt:   res.data.data.triggeredAt,
        guardianCount: res.data.data.guardianCount,
      });
      navigate('/sos/active');
    } catch (err) {
      if (err.response?.status === 429) return; // cooldown — silently ignore
      toast.error('Voice SOS failed. Please use the SOS button.');
    }
  }, [navigate]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return; // browser not supported
    if (recognitionRef.current) return;

    const keywords = keywordsString ? keywordsString.split(',') : [];

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = 'en-IN'; // supports Hindi + English mixed
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('🗣️ Voice SOS active. Listening for:', keywords);
    };

    recognition.onresult = (event) => {
      if (cooldownRef.current) return;
      if (activeSosIdRef.current) return; // SOS already active — don't re-trigger

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result     = event.results[i];
        
        // Strip punctuation and convert to lowercase for robust matching
        let transcript = result[0].transcript.toLowerCase();
        transcript = transcript.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
        
        const confidence = result[0].confidence;

        // Only log if it's somewhat a real word to avoid spam
        if (transcript.length > 0) {
           console.log(`🎤 Heard: "${transcript}" (Confidence: ${confidence.toFixed(2)}, Final: ${result.isFinal})`);
        }

        const matchedKeyword = keywords.find(kw => transcript.includes(kw));

        // Interim results can randomly drop confidence to 0. Treat final results with leniency.
        const isReliable = confidence >= threshold || (result.isFinal && confidence > 0);

        if (matchedKeyword && isReliable) {
          console.log(`✅ Voice SOS Triggered by keyword: "${matchedKeyword}"!`);
          cooldownRef.current = true;
          handleVoiceTrigger(matchedKeyword, confidence);
          setTimeout(() => { cooldownRef.current = false; }, 60000);
          break;
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      // Auto-restart unless SOS is already active
      if (enabled && !activeSosIdRef.current) {
        setTimeout(startListening, 500); // reduced delay slightly for tighter loop
      }
    };

    recognition.onerror = (e) => {
      console.error('🎙️ Voice SOS Error:', e.error);
      if (e.error === 'not-allowed') {
        toast.error('Microphone permission denied. Voice SOS disabled.');
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start SpeechRecognition:', e);
    }
  }, [enabled, keywordsString, threshold, handleVoiceTrigger]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Remove auto-restart
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (enabled && keywordsString.length > 0 && !activeSosId) {
      startListening();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [enabled, keywordsString, activeSosId, startListening, stopListening]);

  return { isListening };
};
