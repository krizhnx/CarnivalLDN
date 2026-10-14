import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAppStore } from '../store/supabaseStore';
import { LoginFormData } from '../types';
import toast from 'react-hot-toast';
import { Button, Field, Input } from './admin/ui';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isLoading } = useAppStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    const success = await login(data.email, data.password);

    if (success) {
      toast.success('Welcome back');
      navigate('/admin/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f6f6f7] font-sans text-zinc-900 antialiased">
      {/* Form */}
      <div className="flex flex-1 flex-col px-6 py-8 sm:px-12">
        <Link to="/" className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          Back to site
        </Link>

        <div className="flex flex-1 items-center justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            <div className="flex items-center gap-2.5">
              <img src="/carnival-logo.svg" alt="Carnival LDN" className="h-9 w-auto" />
              <span className="rounded-md bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Admin</span>
            </div>
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-zinc-900">Welcome back</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Sign in to manage events, orders and guestlists.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <Field label="Email" htmlFor="email" error={errors.email?.message}>
                <Input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@carnivalldn.com"
                  leading={<Mail className="h-4 w-4" />}
                  invalid={!!errors.email}
                  className="h-11"
                />
              </Field>

              <Field label="Password" htmlFor="password" error={errors.password?.message}>
                <div className="relative">
                  <Input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    leading={<Lock className="h-4 w-4" />}
                    invalid={!!errors.password}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-zinc-400 hover:text-zinc-700"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <Button type="submit" variant="primary" size="lg" loading={isLoading} className="w-full">
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </motion.div>
        </div>

        <p className="text-xs text-zinc-400">© {new Date().getFullYear()} Carnival LDN</p>
      </div>

      {/* Visual */}
      <div className="hidden p-3 lg:block lg:w-[48%] xl:w-[52%]">
        <div className="relative h-full overflow-hidden rounded-[28px] bg-zinc-900">
          <img src="/hero/hero-wide-poster.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 p-10">
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-white/60">Carnival LDN</p>
            <p className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
              Events, orders, guestlists and the door — in one place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
