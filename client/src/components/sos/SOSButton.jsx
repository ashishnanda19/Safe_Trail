import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Shield } from 'lucide-react';
import { triggerSOS } from '@/api/sos.api';
import { useSosStore } from '@/store/sosStore';
import { useSocketStore } from '@/store/socketStore';

import { useAuthStore } from '@/store/authStore';

const SOSButton = ({ lat, lng }) => {
  const navigate = useNavigate();
  const { setActive } = useSosStore();
  const { socket } = useSocketStore();
  const { sosDuration } = useAuthStore();

  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const rafRef = useRef(null);
  const startTimeRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  const triggerEmergency = useCallback(async () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    setTriggered(true);

    try {
      navigator.vibrate?.([200, 100, 200]);
      const data = await triggerSOS({
        latitude: lat || 28.6139,
        longitude: lng || 77.2090,
      });

      const guardianCount = data.guardianCount || 0;

      setActive({
        sosEventId: data.sosEventId,
        triggeredAt: new Date().toISOString(),
        guardianCount,
      });

      if (guardianCount === 0) {
        toast.error(
          '⚠️ SOS activated but no guardians were notified. Go to Guardians and add trusted contacts.',
          { duration: 8000 }
        );
      } else {
        toast.success(
          `🚨 SOS sent! ${guardianCount} guardian${guardianCount !== 1 ? 's' : ''} notified via SMS & app`,
          { duration: 6000 }
        );
      }

      // Join SOS room via socket
      socket?.emit('map:join-sos', { sosEventId: data.sosEventId });
      navigate('/sos/active');
    } catch (err) {
      toast.error(
        <div>
          <p>SOS failed. <button className="underline font-semibold" onClick={() => window.location.href='tel:112'}>Call 112 directly</button></p>
        </div>,
        { duration: 10000 }
      );
      hasTriggeredRef.current = false;
      setTriggered(false);
      setProgress(0);
    }
  }, [lat, lng, navigate, setActive, socket]);

  const startHold = useCallback((e) => {
    e.preventDefault();
    if (triggered) return;
    setIsHolding(true);
    hasTriggeredRef.current = false;
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const pct = Math.min((elapsed / sosDuration) * 100, 100);
      setProgress(pct);

      if (pct < 100) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        triggerEmergency();
      }
    };
    rafRef.current = requestAnimationFrame(animate);
  }, [triggered, triggerEmergency, sosDuration]);

  const cancelHold = useCallback(() => {
    if (hasTriggeredRef.current) return;
    cancelAnimationFrame(rafRef.current);
    setIsHolding(false);
    setProgress(0);
  }, []);

  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference * (1 - progress / 100);

  const durationSecs = (sosDuration / 1000).toFixed(sosDuration % 1000 === 0 ? 0 : 1);

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Outer pulse rings — only visible when holding */}
      <div className="relative flex items-center justify-center">
        {isHolding && (
          <>
            <div className="absolute w-[200px] h-[200px] rounded-full bg-[#E53E6D] opacity-10 sos-pulse-ring" />
            <div className="absolute w-[170px] h-[170px] rounded-full bg-[#E53E6D] opacity-15 sos-warning-ring" />
          </>
        )}

        {/* SVG progress ring */}
        <svg className="absolute" width="152" height="152" viewBox="0 0 152 152">
          <circle cx="76" cy="76" r="58" fill="none" stroke="#FCE4ED" strokeWidth="6" />
          <circle
            cx="76" cy="76" r="58"
            fill="none"
            stroke="#E53E6D"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 76 76)"
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>

        {/* Main button */}
        <button
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Hold to trigger emergency SOS"
          disabled={triggered}
          className={`
            w-[140px] h-[140px] rounded-full text-white flex flex-col items-center justify-center
            shadow-2xl transition-transform duration-150 touch-none
            ${isHolding ? 'scale-95 shadow-lg' : 'scale-100'}
            ${triggered ? 'bg-green-500 cursor-default' : 'bg-[#E53E6D] active:bg-[#C0304F] cursor-pointer'}
          `}
          style={{ boxShadow: isHolding ? '0 0 0 8px rgba(229,62,109,0.2), 0 8px 32px rgba(229,62,109,0.4)' : '0 8px 32px rgba(229,62,109,0.35)' }}
        >
          <Shield className="w-10 h-10 mb-1" strokeWidth={1.5} />
          <span className="text-xs font-bold tracking-widest">
            {triggered ? 'SENT' : isHolding ? 'HOLD...' : 'HOLD FOR'}
          </span>
          {!triggered && <span className="text-xs font-bold tracking-widest">SOS</span>}
        </button>
      </div>

      <p className="text-xs text-slate-500 font-medium">
        {triggered ? 'Help is on the way' : `Press and hold for ${durationSecs} seconds`}
      </p>
    </div>
  );
};

export default SOSButton;
