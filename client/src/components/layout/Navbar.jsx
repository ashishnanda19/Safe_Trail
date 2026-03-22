import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSosStore } from '@/store/sosStore';
import { useState, useEffect } from 'react';
import { useSocketStore } from '@/store/socketStore';
import { Shield, LayoutDashboard, Map, Flag, Users, User, Bell } from 'lucide-react';

export const Navbar = () => {
  const navigate = useNavigate();
  const { activeSosId, triggeredAt } = useSosStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeSosId) return;
    const i = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(triggeredAt)) / 1000));
    }, 1000);
    return () => clearInterval(i);
  }, [activeSosId, triggeredAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, '0');

  const { socket } = useSocketStore();
  const { user } = useAuthStore();
  const [alertCount, setAlertCount] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('gc_alerts') || '[]').filter(a => !a.read).length; }
    catch { return 0; }
  });

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      try {
        const alerts = JSON.parse(sessionStorage.getItem('gc_alerts') || '[]');
        setAlertCount(alerts.filter(a => !a.read).length + 1);
      } catch {}
    };
    socket.on('sos:triggered', handler);
    return () => socket.off('sos:triggered', handler);
  }, [socket]);

  const firstName = user?.name?.split(' ')[0];

  const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/map', icon: Map, label: 'Map' },
    { to: '/incidents', icon: Flag, label: 'Incidents' },
    { to: '/guardians', icon: Users, label: 'Guardians' },
    { to: '/alerts', icon: Bell, label: 'Alerts', badge: alertCount },
    { to: '/profile', icon: User, label: firstName || 'Profile' },
  ];

  return (
    <>
      {/* Active SOS global banner */}
      {activeSosId && (
        <button
          onClick={() => navigate('/sos/active')}
          className="fixed top-0 inset-x-0 z-50 bg-[#E53E6D] text-white px-4 py-2.5 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="font-semibold text-sm">SOS ACTIVE</span>
          </div>
          <span className="text-sm">{mins}:{secs} elapsed · Tap to return</span>
        </button>
      )}

      {/* Desktop top navbar */}
      <nav className={`hidden sm:flex items-center justify-between px-6 h-14 bg-white border-b border-slate-200 ${activeSosId ? 'mt-10' : ''}`}>
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-[#E53E6D]">
          <Shield className="w-5 h-5" />
          SafeTraiL
        </Link>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} icon={<Icon className="w-4 h-4" />} label={label} badge={badge} />
          ))}
        </div>
      </nav>
    </>
  );
};

const NavLink = ({ to, icon, label, badge }) => {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-[#FCE4ED] text-[#E53E6D]' : 'text-slate-600 hover:bg-slate-100'}`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#E53E6D] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {Math.min(badge, 9)}
        </span>
      )}
    </Link>
  );
};

export const BottomNav = () => {
  const { pathname } = useLocation();
  const { activeSosId } = useSosStore();
  const { socket } = useSocketStore();
  const [alertCount, setAlertCount] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('gc_alerts') || '[]').filter(a => !a.read).length; }
    catch { return 0; }
  });

  useEffect(() => {
    if (!socket) return;
    const handler = () => setAlertCount(c => c + 1);
    socket.on('sos:triggered', handler);
    return () => socket.off('sos:triggered', handler);
  }, [socket]);

  const BOTTOM_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/map', icon: Map, label: 'Map' },
    { to: '/incidents', icon: Flag, label: 'Incidents' },
    { to: '/alerts', icon: Bell, label: 'Alerts', badge: alertCount },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className={`sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 ${activeSosId ? 'mb-10' : ''}`}>
      <div className="flex">
        {BOTTOM_ITEMS.map(({ to, icon: Icon, label, badge }) => {
          const active = pathname === to || pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              className={`relative flex-1 flex flex-col items-center py-2 gap-0.5 min-h-[56px] transition-colors ${active ? 'text-[#E53E6D]' : 'text-slate-500'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
              {badge > 0 && (
                <span className="absolute top-1 right-1/4 w-4 h-4 bg-[#E53E6D] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {Math.min(badge, 9)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
