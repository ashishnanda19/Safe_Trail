import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { useSocketStore } from '@/store/socketStore';
import BaseMap from '@/components/map/BaseMap';
import LiveTracker from '@/components/map/LiveTracker';
import { Button, Card } from '@/components/ui';
import { getLatestLivePing } from '@/api/map.api';

const GuardianAlertPage = () => {
  const { id: sosEventId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocketStore();

  const [position, setPosition] = useState(null);
  const [triggeredAt] = useState(new Date());
  const [elapsed, setElapsed] = useState(0);
  const [sosUser, setSosUser] = useState(null);
  const [resolved, setResolved] = useState(false);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - triggeredAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [triggeredAt]);

  // Join SOS room and listen for live pings
  useEffect(() => {
    if (!socket || !sosEventId) return;

    socket.emit('map:join-sos', { sosEventId });

    socket.on('map:position', ({ lat, lng, userName, userId }) => {
      setPosition({ lat, lng });
      if (userName) setSosUser({ name: userName, id: userId });
    });

    socket.on('map:tracking-ended', () => {
      setResolved(true);
    });

    return () => {
      socket.off('map:position');
      socket.off('map:tracking-ended');
    };
  }, [socket, sosEventId]);

  // Fetch initial position
  useEffect(() => {
    getLatestLivePing(sosEventId)
      .then(d => { if (d?.ping) setPosition({ lat: d.ping.lat, lng: d.ping.lng }); })
      .catch(() => {});
  }, [sosEventId]);

  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, '0');
  const displayName = sosUser?.name || 'Someone';

  return (
    <div className="flex flex-col h-screen">
      {/* Alert header */}
      <div className={`px-4 py-4 flex flex-col gap-1 ${resolved ? 'bg-green-600' : 'bg-[#E53E6D]'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!resolved && <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />}
            <span className="text-white font-bold text-lg">
              {resolved ? '✅ SOS RESOLVED' : '🚨 EMERGENCY ALERT'}
            </span>
          </div>
          <span className="text-white/80 font-mono text-sm">{mins}:{secs}</span>
        </div>
        <p className="text-white/90 text-sm">{displayName} needs help · Triggered {mins}:{secs} ago</p>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <BaseMap center={position ? [position.lat, position.lng] : undefined} zoom={15} style={{ height: '100%' }}>
          {position && <LiveTracker lat={position.lat} lng={position.lng} isSOS follow />}
        </BaseMap>

        {!position && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
            <div className="bg-white px-4 py-3 rounded-xl text-sm text-slate-600">
              Waiting for live location…
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="bg-white border-t border-slate-200 px-4 py-5">
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          {resolved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium text-center">
              ✅ {displayName} has marked themselves as safe.
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <p className="text-xs text-slate-500">Live location</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Waiting…'}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-slate-500">Updated</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {position ? 'Live' : 'Pending'}
              </p>
            </Card>
          </div>

          {sosUser?.phone && (
            <Button
              variant="secondary"
              fullWidth
              icon={<Phone className="w-4 h-4" />}
              onClick={() => window.location.href = `tel:${sosUser.phone}`}
            >
              Call {displayName}
            </Button>
          )}

          <Button variant="primary" fullWidth onClick={() => navigate('/dashboard')}>
            I&apos;m on my way →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuardianAlertPage;
