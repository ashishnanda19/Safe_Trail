import { useQuery } from '@tanstack/react-query';
import { getActiveSOS } from '@/api/admin.api';
import { AdminLayout } from './AdminDashboardPage';
import { Badge, Card, Skeleton } from '@/components/ui';
import { AlertTriangle, Clock } from 'lucide-react';

const ActiveSOSPage = () => {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['admin', 'active-sos'],
    queryFn: getActiveSOS,
    refetchInterval: 15000,
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Active SOS Events</h1>
          {events.length > 0 && <Badge variant="danger" className="!text-sm !px-3 !py-1">{events.length} active</Badge>}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">{[1,2].map(i => <Skeleton key={i} className="h-32" />)}</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-slate-900">All clear</h3>
            <p className="text-sm text-slate-500 mt-1">No active SOS events right now</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {events.map(ev => {
              const dur = Math.floor((Date.now() - new Date(ev.triggered_at)) / 60000);
              return (
                <Card key={ev.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#E53E6D] rounded-full animate-pulse" />
                        <span className="font-semibold text-slate-900">{ev.user_name || 'Unknown User'}</span>
                        <Badge variant="danger">ACTIVE</Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{ev.user_phone || ev.user_email}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm font-mono text-[#E53E6D] font-semibold">
                        <Clock className="w-4 h-4" /> {dur}m elapsed
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Started {new Date(ev.triggered_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400">Guardians notified</p>
                      <p className="text-lg font-bold text-slate-900">{ev.guardians_notified || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Last ping</p>
                      <p className="text-sm font-medium text-slate-700">
                        {ev.latest_lat ? `${Number(ev.latest_lat).toFixed(4)}, ${Number(ev.latest_lng).toFixed(4)}` : 'No pings yet'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Event ID</p>
                      <p className="text-xs font-mono text-slate-500 truncate">{ev.id}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        <p className="text-xs text-slate-400 text-center">Auto-refreshes every 15 seconds</p>
      </div>
    </AdminLayout>
  );
};

export default ActiveSOSPage;
