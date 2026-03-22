import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield } from 'lucide-react';
import { register as registerApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { connectSocket } from '@/lib/socket';
import { Button, Input } from '@/components/ui';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['user', 'volunteer']),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'user' },
  });

  const onSubmit = async (formData) => {
    setIsLoading(true);
    setError('');
    try {
      const { confirmPassword, ...payload } = formData;
      const data = await registerApi(payload);
      login(data);
      connectSocket(data.accessToken);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FCE4ED] via-white to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E53E6D] rounded-2xl shadow-lg mb-4">
            <Shield className="w-9 h-9 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">SafeTraiL</h1>
          <p className="text-sm text-slate-500 mt-1">Join the safety network</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Create account</h2>

          {error && (
            <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Full name" placeholder="Priya Sharma" error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register('email')} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Phone number</label>
              <div className="flex">
                <span className="flex items-center px-3 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg text-sm text-slate-500">+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  className="flex-1 border border-slate-200 rounded-r-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#E53E6D]/20 focus:border-[#E53E6D]"
                  {...register('phone')}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <Input label="Password" type="password" placeholder="Min. 6 characters" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm password" type="password" placeholder="••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="mt-2">
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#E53E6D] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
