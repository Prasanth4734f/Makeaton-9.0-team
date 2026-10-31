import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Building2,
  DollarSign,
  Activity,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { loginSchema } from '../utils/validators';
import { DEMO_ACCOUNTS } from '../data/mockData';
import { Button } from '../components/ui/Button';

const METRICS_SHOWCASE = [
  { label: 'Platform MRR Tracked', value: '₹4,18,500', change: '+8.2%' },
  { label: 'Active Subscriptions', value: '142 Orgs', change: '+24%' },
  { label: 'Collection Efficiency', value: '99.4%', change: 'Optimal' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, authLoading, authError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [activeDemoRole, setActiveDemoRole] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      if (result.user.role === 'customer') {
        navigate('/customer-portal');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const fillDemo = (account) => {
    setActiveDemoRole(account.role);
    setValue('email', account.email, { shouldValidate: true });
    setValue('password', account.password, { shouldValidate: true });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* ── Left Branding Panel ────────────────────────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between p-12 overflow-hidden bg-[#070A11] border-r border-slate-800/80">
        {/* Glow Gradients */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white font-extrabold text-xl shadow-lg shadow-indigo-600/40">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white">REVORA</span>
                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Subscription Revenue Intelligence Platform</p>
            </div>
          </div>

          <div className="mt-14 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md mb-4">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Automate Billing • Guard Recurring Yield
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Manage subscriptions. Protect recurring revenue.
            </h1>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              Unified lifecycle operations, Indian Rupee GST compliance, automated dunning, and predictive churn mitigation for fast-growing SaaS businesses.
            </p>
          </div>
        </div>

        {/* Center: Live Metrics Widget Preview */}
        <div className="relative z-10 my-8 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live Revenue Engine</span>
            </div>
            <span className="text-[11px] font-mono text-indigo-400">INR System Active</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {METRICS_SHOWCASE.map((m, i) => (
              <div key={i} className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/60">
                <span className="block text-[10px] font-medium text-slate-400 truncate">{m.label}</span>
                <span className="block text-sm font-bold text-white mt-1">{m.value}</span>
                <span className="text-[10px] font-semibold text-emerald-400 mt-0.5 inline-block">{m.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Hackathon & Teammate Note */}
        <div className="relative z-10 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>Harshitha • Lead Frontend & UX</span>
          <span className="text-slate-400">FastAPI & SQL Architecture</span>
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-16 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-extrabold text-lg">
              R
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">REVORA</span>
              <p className="text-xs text-slate-500">Subscription Revenue Intelligence</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>
            <p className="mt-1 text-xs text-slate-500 font-medium">
              Enter your credentials or choose a pre-configured hackathon demo persona below.
            </p>
          </div>

          {/* Quick Demo Selector Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Instant Demo Access
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = activeDemoRole === acc.role;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className={clsx(
                      'p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden',
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold capitalize text-slate-800">
                        {acc.role}
                      </span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />}
                    </div>
                    <span className="block text-[10px] text-slate-500 truncate mt-0.5">
                      {acc.label.split('—')[1]?.trim() || acc.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Notice</p>
                <p className="mt-0.5 text-rose-700">{authError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="name@company.in"
                  {...register('email')}
                  className={clsx(
                    'w-full rounded-xl border bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 transition-all',
                    'focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    errors.email ? 'border-rose-400' : 'border-slate-200'
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={clsx(
                    'w-full rounded-xl border bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-800 placeholder:text-slate-400 transition-all',
                    'focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
                    errors.password ? 'border-rose-400' : 'border-slate-200'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={authLoading}
              icon={ArrowRight}
              iconRight
              className="w-full mt-2 btn-primary"
            >
              {authLoading ? 'Signing In to Platform...' : 'Sign In to Platform'}
            </Button>
          </form>

          {/* Footer note & register link */}
          <div className="pt-2 text-center text-xs text-slate-500 space-y-2">
            <div>
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:underline">
                Register organization
              </Link>
            </div>
            <p className="text-[11px] text-slate-400">
              🔒 Prototype / Hackathon demo mode — client adapter simulated authentication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
