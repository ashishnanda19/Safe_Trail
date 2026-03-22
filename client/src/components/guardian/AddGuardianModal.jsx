import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { addGuardian } from '@/api/guardian.api';
import { Modal, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number'),
});

const AddGuardianModal = ({ isOpen, onClose }) => {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: ({ phone }) => addGuardian(phone),
    onSuccess: (_, { phone }) => {
      toast.success(`Invite sent to ${phone}`);
      qc.invalidateQueries({ queryKey: ['guardians', user?.id] });
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Guardian">
      <form onSubmit={handleSubmit(mutate)} className="flex flex-col gap-4">
        <p className="text-sm text-slate-500">
          Enter the phone number of someone you trust. They'll receive an SMS with the invite.
        </p>
        <Input
          label="Phone number"
          placeholder="+91 98765 43210"
          type="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" fullWidth isLoading={isPending}>
            Send Invite via SMS
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddGuardianModal;
