import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import { getAdminStats } from '@/api/admin.api';
import { updateUserRole } from '@/api/admin.api';
import { AdminLayout } from './AdminDashboardPage';
import { Badge, Skeleton } from '@/components/ui';
import api from '@/api/axios';

const ROLES = ['user', 'volunteer', 'admin'];
const ROLE_BADGES = { admin: 'danger', volunteer: 'info', user: 'default' };

const UserManagementPage = () => {
  const qc = useQueryClient();

  // Use admin stats for now; in production you'd have a GET /admin/users endpoint
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then(r => r.data.data),
    staleTime: 1000 * 60,
  });

  const { mutate: changeRole } = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => {
      toast.success('Role updated');
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Failed to update role'),
  });

  const users = data?.users || [];

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage user roles and accounts</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-6 flex flex-col gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500 font-medium bg-slate-50">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">Joined</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Change role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#E53E6D] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                          {(u.name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_BADGES[u.role] || 'default'}>{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={e => changeRole({ userId: u.id, role: e.target.value })}
                        className="border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#E53E6D]/20 cursor-pointer"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagementPage;
