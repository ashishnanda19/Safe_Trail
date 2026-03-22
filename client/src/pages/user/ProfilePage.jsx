import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Shield, LogOut, User, Bell, Settings, Key } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { updateMe } from '@/api/user.api';
import { logout as logoutApi } from '@/api/auth.api';
import { disconnectSocket } from '@/lib/socket';
import { Badge, Button, Input, Card, Toggle, Modal } from '@/components/ui';
import { Navbar, BottomNav } from '@/components/layout/Navbar';

const ROLE_LABELS = { user: 'User', volunteer: 'Volunteer', admin: 'Admin' };

const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    user, refreshToken, logout, updateUser,
    sosDuration, setSosDuration,
    autoShareLocation, setAutoShareLocation
  } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { name: user?.name || '' },
  });

  const { mutate: save } = useMutation({
    mutationFn: (data) => updateMe(data),
    onSuccess: (data) => {
      updateUser(data.user);
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleLogout = async () => {
    try {
      await logoutApi(refreshToken);
    } catch {}
    disconnectSocket();
    logout();
    navigate('/login', { replace: true });
  };

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 sm:pb-6">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 flex flex-col gap-5">
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>

        {/* Profile header */}
        <Card className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#E53E6D] flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg">{user?.name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="primary">{ROLE_LABELS[user?.role] || 'User'}</Badge>
              {memberSince && <span className="text-xs text-slate-400">Since {memberSince}</span>}
            </div>
          </div>
        </Card>

        {/* Edit profile */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#E53E6D]" />
            <h3 className="font-semibold text-slate-900 text-sm">Edit Profile</h3>
          </div>
          <form onSubmit={handleSubmit(save)} className="flex flex-col gap-4">
            <Input label="Full name" placeholder="Your name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input
                value={user?.phone || ''}
                disabled
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400">Contact support to change your phone number</p>
            </div>
            <Button type="submit" isLoading={isSubmitting}>Save changes</Button>
          </form>
        </Card>

        {/* Notification settings */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-[#E53E6D]" />
            <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
          </div>
          <div className="flex flex-col gap-4">
            <Toggle label="SMS alerts" checked={smsAlerts} onChange={setSmsAlerts} />
            <Toggle label="Push notifications" checked={pushAlerts} onChange={setPushAlerts} />
          </div>
        </Card>

        {/* Safety settings */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#E53E6D]" />
            <h3 className="font-semibold text-slate-900 text-sm">Safety Settings</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-slate-700 mb-2">SOS hold duration</p>
              <div className="flex gap-2">
                {[
                  { label: '1s', value: 1000 },
                  { label: '1.5s', value: 1500 },
                  { label: '2s', value: 2000 }
                ].map(d => (
                  <button
                    key={d.label}
                    onClick={() => setSosDuration(d.value)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                      sosDuration === d.value
                        ? 'bg-[#E53E6D] text-white border-[#E53E6D] shadow-lg shadow-rose-200 scale-[1.02]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <Toggle label="Auto-share location after SOS" checked={autoShareLocation} onChange={setAutoShareLocation} />
          </div>
        </Card>

        {/* Account */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-[#E53E6D]" />
            <h3 className="font-semibold text-slate-900 text-sm">Account</h3>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="secondary" fullWidth icon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
              Log out
            </Button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-xs text-red-400 text-center hover:text-red-600 transition-colors"
            >
              Delete account
            </button>
          </div>
        </Card>
      </main>

      <BottomNav />

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
        <p className="text-sm text-slate-600 mb-4">
          This will permanently delete your account and all your data. This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" fullWidth>Delete forever</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
