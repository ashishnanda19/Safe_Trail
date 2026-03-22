import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Clock, MapPin, Phone } from 'lucide-react';
import { useSocketStore } from '@/store/socketStore';
import { Card, Button, Badge } from '@/components/ui';
import { Navbar, BottomNav } from '@/components/layout/Navbar';

const AlertsPage = () => {
  const navigate = useNavigate();
  const { socket, isConnected } = useSocketStore();
  const [alerts, setAlerts] = useState(() => {
    // Persist alerts across navigations via sessionStorage
    try {
      return JSON.parse(sessionStorage.getItem('gc_alerts') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    if (!socket) return;

    const handler = ({ sosEventId, userId, userName, lat, lng }) => {
      const newAlert = {
        id: sosEventId,
        userName: userName || 'Unknown user',
        triggeredAt: new Date().toISOString(),
        lat, lng,
        read: false,
      };

      setAlerts(prev => {
        const updated = [newAlert, ...prev.filter(a => a.id !== sosEventId)].slice(0, 20);
        sessionStorage.setItem('gc_alerts', JSON.stringify(updated));
        return updated;
      });
    };

    socket.on('sos:triggered', handler);
    return () => socket.off('sos:triggered', handler);
  }, [socket]);

  const markRead = (id) => {
    setAlerts(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, read: true } : a);
      sessionStorage.setItem('gc_alerts', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAll = () => {
    setAlerts([]);
    sessionStorage.removeItem('gc_alerts');
  };

  const unreadCount = alerts.filter(a => !a.read).length;
  const timeAgo = (iso) => {
    const diff = (Date.now() - new Date(iso)) / 1000;
    if (diff < 60) return `${Math.round(diff)}s ago`;
    if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
    return `${Math.round(diff / 3600)}h ago`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 sm:pb-6">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-4 sm:pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">SOS Alerts</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
              <p className="text-xs text-slate-500">{isConnected ? 'Listening for emergencies' : 'Reconnecting…'}</p>
            </div>
          </div>
          {alerts.length > 0 && (
            <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
              Clear all
            </button>
          )}
        </div>

        {/* Status card */}
        <div className={`flex items-center gap-3 p-4 rounded-xl mb-5 border ${isConnected ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <Shield className={`w-5 h-5 shrink-0 ${isConnected ? 'text-green-600' : 'text-amber-500'}`} />
          <div>
            <p className={`text-sm font-semibold ${isConnected ? 'text-green-800' : 'text-amber-800'}`}>
              {isConnected ? 'You are monitoring your circle' : 'Connecting to guardian network…'}
            </p>
            <p className={`text-xs mt-0.5 ${isConnected ? 'text-green-600' : 'text-amber-600'}`}>
              {isConnected
                ? 'You will be instantly notified when someone triggers SOS'
                : 'Keep this page open to ensure you receive alerts'}
            </p>
          </div>
        </div>

        {/* Alert list */}
        {alerts.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Shield className="w-8 h-8 text-green-500" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">All clear</h3>
              <p className="text-sm text-slate-500 mt-1">No SOS events received yet.<br />You'll be notified automatically.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map(alert => (
              <Card
                key={alert.id}
                className={`p-4 border-l-4 border-l-[#E53E6D] ${alert.read ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {!alert.read && (
                      <span className="w-2 h-2 bg-[#E53E6D] rounded-full animate-pulse shrink-0 mt-1" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">{alert.userName}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {timeAgo(alert.triggeredAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="danger" className="shrink-0">SOS</Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    fullWidth
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    onClick={() => {
                      markRead(alert.id);
                      navigate(`/guardian/alert/${alert.id}`);
                    }}
                  >
                    Track live location
                  </Button>
                  {!alert.read && (
                    <Button size="sm" variant="secondary" onClick={() => markRead(alert.id)}>
                      Dismiss
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default AlertsPage;
