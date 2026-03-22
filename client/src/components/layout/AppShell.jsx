import { useSocket } from '@/hooks/useSocket';
import { useSocketStore } from '@/store/socketStore';
import { Wifi, WifiOff } from 'lucide-react';

/**
 * AppShell — mounts useSocket globally so the socket connection
 * is always alive whenever a user is authenticated.
 * Also shows a subtle connection status dot in the corner.
 */
const AppShell = ({ children }) => {
  useSocket(); // ← THIS is the critical call that was missing
  const { isConnected } = useSocketStore();

  return (
    <>
      {children}
      {/* Connection status indicator — bottom-left, only visible on desktop */}
      <div className="fixed bottom-2 left-2 z-50 hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm">
        {isConnected ? (
          <>
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-slate-400 font-medium">Live</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            <span className="text-[10px] text-slate-400 font-medium">Connecting…</span>
          </>
        )}
      </div>
    </>
  );
};

export default AppShell;
