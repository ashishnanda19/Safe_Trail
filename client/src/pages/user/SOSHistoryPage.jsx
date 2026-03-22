import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getSosHistory } from '@/api/sos.api';
import { Badge, Card, Skeleton } from '@/components/ui';
import { Navbar, BottomNav } from '@/components/layout/Navbar';

const SOSHistoryPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['sos', 'history'],
    queryFn: () => getSosHistory({ limit: 20 }),
    staleTime: 1000 * 60 * 2,
  });

  const events = data?.data || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 sm:pb-6">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-4 sm:pt-6">
        <h1 className="text-xl font-bold text-slate-900 mb-6">SOS History</h1>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="font-semibold text-slate-900">No SOS events</h3>
            <p className="text-sm text-slate-500 mt-1">Stay safe — your history will appear here</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((evt) => {
              const duration = evt.resolved_at
                ? Math.round((new Date(evt.resolved_at) - new Date(evt.triggered_at)) / 60000)
                : null;
              return (
                <Card key={evt.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${evt.status === 'resolved' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {evt.status === 'resolved'
                        ? <CheckCircle className="w-5 h-5 text-green-600" />
                        : <AlertCircle className="w-5 h-5 text-[#E53E6D]" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900 text-sm">
                          {new Date(evt.triggered_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <Badge variant={evt.status === 'resolved' ? 'success' : 'danger'}>{evt.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(evt.triggered_at).toLocaleTimeString()}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                        {duration !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {duration}m duration
                          </span>
                        )}
                        {evt.guardians_notified > 0 && (
                          <span>{evt.guardians_notified} guardian{evt.guardians_notified !== 1 ? 's' : ''} alerted</span>
                        )}
                      </div>
                      {evt.resolution_note && (
                        <p className="text-xs text-slate-600 mt-1 italic">"{evt.resolution_note}"</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default SOSHistoryPage;
