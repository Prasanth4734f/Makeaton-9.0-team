import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  ShieldCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { registerSchema, getPasswordStrength } from '../utils/validators';
import { Button } from '../components/ui/Button';

// ─── Feature bullets (same brand voice as Login) ─────────────────────────────
const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Track Every Rupee',
    desc: 'Live MRR, ARR, and cohort revenue insights from day one.',
  },
  {
    icon: Zap,
    title: 'Billing on Autopilot',
    desc: 'Invoices, payment reminders, and retries — all automated.',
  },
  {
    icon: ShieldCheck,
    title: 'Churn Prevention',
    desc: 'AI scoring flags at-risk accounts before they leave.',
  },
];

// ─── Password strength bar colours ───────────────────────────────────────────
const STRENGTH_STEPS = [
  'bg-red-500',
  'bg-amber-500',
  'bg-yellow-400',
  'bg-green-500',
  'bg-emerald-500',
];

export default function Register() {
  const navigate = useNavigate();
  const { register: authRegister, authLoading, authError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');
  const strength = getPasswordStrength(passwordValue);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const result = await authRegister({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[45%] flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-20 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -left-24 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <span className="text-white font-bold text-xl tracking-tight">R</span>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">REVORA</span>
          </div>

          <p className="mt-6 text-slate-300 text-lg leading-relaxed max-w-sm font-light">
            Manage subscriptions. Automate billing. Protect recurring revenue.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="relative z-10 space-y-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-slate-400 text-sm mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tag */}
        <div className="relative z-10">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} REVORA. Subscription Revenue Intelligence Platform.
          </p>
        </div>
      </div>

      {/* ── Right registration panel ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base">R</span>
            </div>
            <span className="text-slate-900 text-xl font-bold tracking-tight">REVORA</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-1 text-sm text-slate-500">Get started with REVORA for free</p>
          </div>

          {/* Auth error */}
          {authError && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Full name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Harshitha Reddy"
                  {...register('name')}
                  className={clsx(
                    'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-white text-slate-900 placeholder-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors',
                    errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  )}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  className={clsx(
                    'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-white text-slate-900 placeholder-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors',
                    errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  {...register('password')}
                  className={clsx(
                    'w-full pl-10 pr-11 py-2.5 rounded-lg border text-sm bg-white text-slate-900 placeholder-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors',
                    errors.password ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {passwordValue.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={clsx(
                          'flex-1 h-1.5 rounded-full transition-all duration-300',
                          i < strength.score ? STRENGTH_STEPS[strength.score - 1] : 'bg-slate-200'
                        )}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className={clsx(
                      'text-xs font-medium',
                      strength.score <= 1 && 'text-red-500',
                      strength.score === 2 && 'text-amber-500',
                      strength.score === 3 && 'text-yellow-500',
                      strength.score === 4 && 'text-green-600',
                      strength.score === 5 && 'text-emerald-600',
                    )}>
                      {strength.label}
                    </p>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  {...register('confirmPassword')}
                  className={clsx(
                    'w-full pl-10 pr-11 py-2.5 rounded-lg border text-sm bg-white text-slate-900 placeholder-slate-400',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors',
                    errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-slate-300 hover:border-slate-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Password hints */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 space-y-1.5">
              <p className="text-xs font-medium text-slate-600 mb-2">Password must contain:</p>
              {[
                { test: passwordValue.length >= 8, label: 'At least 8 characters' },
                { test: /[A-Z]/.test(passwordValue), label: 'One uppercase letter' },
                { test: /[a-z]/.test(passwordValue), label: 'One lowercase letter' },
                { test: /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue), label: 'One special character' },
              ].map(({ test, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <CheckCircle2
                    className={clsx(
                      'h-3.5 w-3.5 transition-colors',
                      test ? 'text-emerald-500' : 'text-slate-300'
                    )}
                  />
                  <span className={clsx('text-xs', test ? 'text-emerald-700' : 'text-slate-400')}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={authLoading}
              className="w-full"
            >
              {authLoading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
              Sign in
            </Link>
          </p>

          {/* Disclaimer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            🔒 Demo mode — authentication is simulated client-side
          </p>
        </div>
      </div>
    </div>
  );
}
