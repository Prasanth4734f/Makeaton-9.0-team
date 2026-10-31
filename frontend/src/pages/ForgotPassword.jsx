import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clsx } from 'clsx';
import {
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  SendHorizonal,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { forgotPasswordSchema } from '../utils/validators';
import { Button } from '../components/ui/Button';

export default function ForgotPassword() {
  const { forgotPassword, authLoading, authError } = useAuth();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    const result = await forgotPassword({ email: data.email });
    if (result.success) {
      setSentEmail(data.email);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100 px-4 py-16">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600" />

        <div className="px-8 py-10">

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-300/40">
              <span className="text-white font-bold text-base tracking-tight">R</span>
            </div>
            <span className="text-slate-900 text-xl font-bold tracking-tight">REVORA</span>
          </div>

          {/* ── Success state ────────────────────────────────────────────── */}
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>

              <h2 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-1">
                Reset link sent to your email
              </p>
              <p className="text-sm font-medium text-indigo-600 mb-6 break-all">
                {sentEmail}
              </p>

              <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-4 mb-8 text-left space-y-2">
                <p className="text-xs font-semibold text-indigo-700">What&rsquo;s next?</p>
                <ul className="space-y-1.5">
                  {[
                    'Open the email from REVORA',
                    'Click the "Reset Password" link',
                    'Create a new strong password',
                    'Sign in with your new credentials',
                  ].map((step, i) => (
                    <li key={step} className="flex items-center gap-2 text-xs text-indigo-600">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-slate-400 mb-6">
                Didn&rsquo;t receive it? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 transition-colors"
                >
                  try again
                </button>
                .
              </p>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            /* ── Form state ──────────────────────────────────────────────── */
            <>
              <h1 className="text-xl font-bold text-slate-900 mb-1">Forgot your password?</h1>
              <p className="text-sm text-slate-500 mb-7 leading-relaxed">
                Enter the email address linked to your REVORA account and we&rsquo;ll send you a reset link.
              </p>

              {/* Auth error */}
              {authError && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{authError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

                {/* Email field */}
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
                        errors.email
                          ? 'border-red-400 bg-red-50'
                          : 'border-slate-300 hover:border-slate-400'
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

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={authLoading}
                  icon={authLoading ? undefined : SendHorizonal}
                  className="w-full"
                >
                  {authLoading ? 'Sending reset link…' : 'Send Reset Link'}
                </Button>
              </form>

              {/* Back link */}
              <div className="mt-6 flex items-center justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>

              {/* Hint */}
              <div className="mt-8 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  <span className="font-semibold text-slate-600">Demo tip:</span>{' '}
                  Try <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">admin@revora.in</span>,{' '}
                  <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">staff@revora.in</span>,{' '}
                  or <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">customer@revora.in</span>
                </p>
              </div>

              <p className="mt-5 text-center text-xs text-slate-400">
                🔒 Demo mode — authentication is simulated client-side
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
