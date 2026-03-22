import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { listGuardians, listInvites } from '@/api/guardian.api';
import GuardianCard from '@/components/guardian/GuardianCard';
import AddGuardianModal from '@/components/guardian/AddGuardianModal';
import { Badge, Skeleton, Card } from '@/components/ui';
import { Navbar, BottomNav } from '@/components/layout/Navbar';

const GuardiansPage = () => {
  const { user } = useAuthStore();
  const [showAdd, setShowAdd] = useState(false);

  const { data: guardians = [], isLoading } = useQuery({
    queryKey: ['guardians', user?.id],
    queryFn: listGuardians,
    staleTime: 1000 * 60 * 2,
  });

  const { data: invites = [] } = useQuery({
    queryKey: ['invites', user?.id],
    queryFn: listInvites,
    staleTime: 1000 * 60 * 2,
  });

  const pendingInvites = invites.filter(i => i.status === 'pending');

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 sm:pb-6">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 pt-4 sm:pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Guardian Circle</h1>
            <p className="text-sm text-slate-500">People who are alerted when you trigger SOS</p>
          </div>
          {guardians.length > 0 && (
            <Badge variant="primary">{guardians.length} active</Badge>
          )}
        </div>

        {/* Pending invites (where user is the guardian) */}
        {pendingInvites.length > 0 && (
          <div className="mb-5 flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending invites for you</p>
            {pendingInvites.map(inv => (
              <GuardianCard
                key={inv.circle_id}
                guardian={{ ...inv, status: 'pending' }}
                showAcceptButton
                circleId={inv.circle_id}
              />
            ))}
          </div>
        )}

        {/* Guardian list */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </Card>
            ))}
          </div>
        ) : guardians.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} />
        ) : (
          <div className="flex flex-col gap-3">
            {guardians.map(g => (
              <GuardianCard key={g.id} guardian={g} />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 rounded-full bg-[#E53E6D] text-white shadow-lg flex items-center justify-center hover:bg-[#C0304F] active:scale-95 transition-all z-40"
        aria-label="Add guardian"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav />
      <AddGuardianModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
};

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center text-center py-16 gap-4">
    <div className="w-20 h-20 rounded-full bg-[#FCE4ED] flex items-center justify-center">
      <Shield className="w-10 h-10 text-[#E53E6D]" strokeWidth={1.5} />
    </div>
    <div>
      <h3 className="font-semibold text-slate-900">No guardians yet</h3>
      <p className="text-sm text-slate-500 mt-1 max-w-xs">
        Add trusted people who will be alerted if you trigger SOS
      </p>
    </div>
    <button
      onClick={onAdd}
      className="px-5 py-2.5 bg-[#E53E6D] text-white rounded-lg text-sm font-medium hover:bg-[#C0304F] transition-colors"
    >
      Add your first guardian
    </button>
  </div>
);

export default GuardiansPage;
