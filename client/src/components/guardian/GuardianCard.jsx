import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { acceptInvite, removeGuardian } from '@/api/guardian.api';
import { useAuthStore } from '@/store/authStore';
import { Badge, Button, Card } from '@/components/ui';
import { MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';

// Deterministic color from name
const nameColor = (name = '') => {
  const colors = ['#E53E6D', '#3B82F6', '#22C55E', '#F97316', '#8B5CF6', '#14B8A6'];
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const GuardianCard = ({ guardian, showAcceptButton = false, circleId }) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);

  const { mutate: accept, isPending: accepting } = useMutation({
    mutationFn: () => acceptInvite(circleId),
    onSuccess: () => {
      toast.success('Guardian accepted!');
      qc.invalidateQueries({ queryKey: ['guardians', user?.id] });
      qc.invalidateQueries({ queryKey: ['invites', user?.id] });
    },
    onError: () => toast.error('Failed to accept invite'),
  });

  const { mutate: remove, isPending: removing } = useMutation({
    mutationFn: () => removeGuardian(guardian.guardian_id || guardian.id),
    onSuccess: () => {
      toast.success('Guardian removed');
      qc.invalidateQueries({ queryKey: ['guardians', user?.id] });
    },
    onError: () => toast.error('Failed to remove guardian'),
  });

  const bg = nameColor(guardian.name || guardian.guardian_name);
  const displayName = guardian.name || guardian.guardian_name || 'Unknown';
  const displayPhone = guardian.phone || guardian.guardian_phone;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
          style={{ background: bg }}
        >
          {displayName.slice(0, 2).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 text-sm truncate">{displayName}</p>
          <p className="text-xs text-slate-500 truncate">{displayPhone}</p>
        </div>

        {/* Status */}
        {guardian.status === 'accepted' && <Badge variant="success">Active</Badge>}
        {guardian.status === 'pending' && <Badge variant="warning">Pending</Badge>}

        {/* Actions */}
        {showAcceptButton ? (
          <Button size="sm" isLoading={accepting} onClick={() => accept()}>
            Accept
          </Button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg z-10 w-40">
                <button
                  onClick={() => { remove(); setShowMenu(false); }}
                  disabled={removing}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove guardian
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default GuardianCard;
