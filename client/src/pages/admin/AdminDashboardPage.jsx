import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Map, AlertTriangle, Users, Settings, Shield, Clock, Activity } from 'lucide-react';
import { getAdminStats, getActiveSOS } from '@/api/admin.api';
import { Badge, Card, Skeleton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const SIDEBAR_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/sos', icon: AlertTriangle, label: 'Active SOS' },
  { to: '/admin/heatmap', icon: Map, label: 'Heatmap' },
  { to: '/admin/users', icon: Users, label: 'Users' },
];

export const AdminLayout = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-[#E53E6D]">
            <Shield className="w-5 h-5" />
            SafeTraiL
          </Link>
          <p className="text-xs text-slate-400 mt-0.5">Admin Console</p>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {SIDEBAR_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = to === '/admin' ? pathname === '/admin' : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-[#FCE4ED] text-[#E53E6D]' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
};

const StatCard = ({ label, value, sub, accent, icon: Icon, loading }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {loading ? (
          <Skeleton className="h-8 w-20 mt-2" />
        ) : (
          <p className={`text-3xl font-bold mt-1 ${accent || 'text-slate-900'}`}>{value ?? '—'}</p>
        )}
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-500" />
        </div>
      )}
    </div>
  </Card>
);

const AdminDashboardPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: getAdminStats,
    refetchInterval: 60000,
  });

  const { data: activeSOS = [], isLoading: loadingActive } = useQuery({
    queryKey: ['admin', 'active-sos'],
    queryFn: getActiveSOS,
    refetchInterval: 30000,
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time overview of SafeTraiL activity</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="SOS Events" value={stats?.totalSosEvents} sub="All time" icon={AlertTriangle} loading={isLoading} />
          <StatCard
            label="Active SOS Now"
            value={activeSOS.length}
            accent={activeSOS.length > 0 ? 'text-[#E53E6D]' : 'text-slate-900'}
            icon={Activity}
            loading={loadingActive}
          />
          <StatCard label="Avg Response" value={stats?.avgResponseTimeMin ? `${stats.avgResponseTimeMin}m` : '—'} icon={Clock} loading={isLoading} />
          <StatCard label="Total Incidents" value={stats?.totalIncidents} sub="Reported" icon={Shield} loading={isLoading} />
        </div>

        {/* Active SOS table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900">Active SOS Events</h2>
            {activeSOS.length > 0 && <Badge variant="danger">{activeSOS.length} active</Badge>}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {loadingActive ? (
              <div className="p-6 flex flex-col gap-3">
                {[1, 2].map(i => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : activeSOS.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No active SOS events</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500 font-medium">
                    <th className="text-left px-4 py-3">User</th>
                    <th className="text-left px-4 py-3">Triggered</th>
                    <th className="text-left px-4 py-3">Duration</th>
                    <th className="text-left px-4 py-3">Guardians</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSOS.map((ev) => {
                    const dur = Math.floor((Date.now() - new Date(ev.triggered_at)) / 60000);
                    return (
                      <tr key={ev.id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{ev.user_name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(ev.triggered_at).toLocaleTimeString()}</td>
                        <td className="px-4 py-3 text-slate-700">{dur}m</td>
                        <td className="px-4 py-3">{ev.guardians_notified || 0}</td>
                        <td className="px-4 py-3"><Badge variant="danger">active</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Stats detail */}
        {stats && (
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Platform Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.totalUsers} />
              <StatCard label="Total Guardians" value={stats.totalGuardians} />
              <StatCard label="This Month" value={stats.sosEventsThisMonth} sub="SOS events" />
              <StatCard label="Resolution Rate" value={stats.resolutionRate ? `${stats.resolutionRate}%` : '—'} />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
