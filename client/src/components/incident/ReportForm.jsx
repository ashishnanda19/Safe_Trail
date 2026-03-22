import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { reportIncident } from '@/api/incident.api';
import { Modal, Button, Textarea, Toggle } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const CATEGORIES = [
  { value: 'harassment', label: '😠 Harassment' },
  { value: 'stalking', label: '👁️ Stalking' },
  { value: 'assault', label: '🚨 Assault' },
  { value: 'unsafe_area', label: '⚠️ Unsafe Area' },
  { value: 'other', label: '📌 Other' },
];

const schema = z.object({
  category: z.string().min(1, 'Select a category'),
  description: z.string().optional(),
  occurred_at: z.string().min(1, 'Enter the date/time'),
  anonymous: z.boolean().default(false),
});

const ReportForm = ({ isOpen, onClose, lat, lng }) => {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      anonymous: false,
      occurred_at: new Date().toISOString().slice(0, 16),
    },
  });

  const anonymous = watch('anonymous');

  const { mutate, isPending } = useMutation({
    mutationFn: (values) => reportIncident({
      ...values,
      // Convert datetime-local (no timezone) → full ISO 8601 with UTC timezone
      occurred_at: values.occurred_at
        ? new Date(values.occurred_at).toISOString()
        : new Date().toISOString(),
      latitude: lat || 28.6139,
      longitude: lng || 77.2090,
    }),
    onSuccess: () => {
      toast.success('Incident reported. Thank you.');
      qc.invalidateQueries({ queryKey: ['incidents', 'nearby'] });
      reset();
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to report incident'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Incident">
      <form onSubmit={handleSubmit(mutate)} className="flex flex-col gap-4">
        {/* Category */}
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-2">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(({ value, label }) => {
              const selected = watch('category') === value;
              return (
                <label
                  key={value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${selected ? 'border-[#E53E6D] bg-[#FCE4ED] text-[#E53E6D]' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  <input type="radio" value={value} {...register('category')} className="sr-only" />
                  {label}
                </label>
              );
            })}
          </div>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
        </div>

        {/* Description */}
        <Textarea
          label="Description (optional)"
          placeholder="What happened? Any details that may help others stay safe..."
          {...register('description')}
        />

        {/* Occurred at */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700">When did this happen?</label>
          <input
            type="datetime-local"
            className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E53E6D]/20 focus:border-[#E53E6D]"
            {...register('occurred_at')}
          />
          {errors.occurred_at && <p className="text-xs text-red-500">{errors.occurred_at.message}</p>}
        </div>

        {/* Anonymous toggle */}
        <Toggle
          label="Hide my identity (anonymous report)"
          checked={anonymous}
          onChange={(v) => setValue('anonymous', v)}
        />

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancel</Button>
          <Button type="submit" fullWidth isLoading={isPending}>Submit Report</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportForm;
