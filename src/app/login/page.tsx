'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/validations';
import Image from 'next/image';

// Microsoft Logo SVG Component
function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
      <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
      <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
    </svg>
  );
}

// Google Logo SVG Component
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// Spinner component
function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

const DEMO_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'demo.admin@nationalgroupindia.com',
    password: 'Demo@123',
    gradient: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-400/30',
    badge: 'bg-purple-500/20 text-purple-200',
    icon: '🛡️',
    description: 'Full access',
  },
  {
    role: 'Manager',
    email: 'demo.manager@nationalgroupindia.com',
    password: 'Demo@123',
    gradient: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-400/30',
    badge: 'bg-blue-500/20 text-blue-200',
    icon: '👔',
    description: 'Team access',
  },
  {
    role: 'Employee',
    email: 'demo.employee@nationalgroupindia.com',
    password: 'Demo@123',
    gradient: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-400/30',
    badge: 'bg-emerald-500/20 text-emerald-200',
    icon: '👤',
    description: 'Standard access',
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get('error'));
  const [isLoading, setIsLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const fillDemoCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Authentication failed');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOSignIn = async (provider?: string) => {
    if (provider === 'MicrosoftOAuth') {
      setIsMicrosoftLoading(true);
    } else if (provider === 'GoogleOAuth') {
      setIsGoogleLoading(true);
    }
    setError(null);
    
    try {
      // Redirect to WorkOS SSO - let the redirect happen naturally
      const url = provider 
        ? `/api/auth/signin?provider=${provider}` 
        : '/api/auth/signin';
      window.location.href = url;
    } catch {
      setError('Failed to initiate sign in. Please try again.');
      setIsMicrosoftLoading(false);
      setIsGoogleLoading(false);
    }
  };

  const handleMicrosoftSignIn = () => handleSSOSignIn('MicrosoftOAuth');
  const handleGoogleSignIn = () => handleSSOSignIn('GoogleOAuth');

  return (
    <div className="space-y-5">
      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-red-500/10 backdrop-blur-sm border border-red-400/20 p-3.5 text-sm text-red-200 flex items-center gap-2">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>
            {error === 'OAuthAccountNotLinked'
              ? 'This email is already linked to another sign-in method.'
              : error === 'AccessDenied'
              ? 'Access denied. Your account may not be active.'
              : error}
          </span>
        </div>
      )}

      {/* Microsoft SSO */}
      <button
        type="button"
        onClick={handleMicrosoftSignIn}
        disabled={isMicrosoftLoading}
        className="group w-full flex items-center justify-center gap-3 h-12 rounded-xl
          bg-white/10 backdrop-blur-sm border border-white/20
          text-white font-medium text-sm
          hover:bg-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/5
          active:scale-[0.98] transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isMicrosoftLoading ? (
          <Spinner />
        ) : (
          <MicrosoftLogo className="h-5 w-5" />
        )}
        Sign in with Microsoft 365
      </button>

      {/* Google SSO */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="group w-full flex items-center justify-center gap-3 h-12 rounded-xl
          bg-white/10 backdrop-blur-sm border border-white/20
          text-white font-medium text-sm
          hover:bg-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/5
          active:scale-[0.98] transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <Spinner />
        ) : (
          <GoogleLogo className="h-5 w-5" />
        )}
        Sign in with Google
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <span className="text-[11px] uppercase tracking-widest text-white/40 font-medium">or</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-medium text-white/70 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              placeholder="you@nationalgroupindia.com"
              className="w-full h-11 pl-10 pr-4 rounded-xl
                bg-white/5 backdrop-blur-sm border border-white/10
                text-white placeholder-white/25 text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/30
                transition-all duration-200"
              {...register('email')}
            />
          </div>
          {errors.email && <p className="text-xs text-red-300 mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-medium text-white/70 uppercase tracking-wider">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="w-full h-11 pl-10 pr-4 rounded-xl
                bg-white/5 backdrop-blur-sm border border-white/10
                text-white placeholder-white/25 text-sm
                focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/30
                transition-all duration-200"
              {...register('password')}
            />
          </div>
          {errors.password && <p className="text-xs text-red-300 mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 text-amber-500
                focus:ring-amber-400/30 focus:ring-offset-0 checked:bg-amber-500"
            />
            <span className="text-white/50 group-hover:text-white/70 transition-colors text-xs">Remember me</span>
          </label>
          <a href="#" className="text-amber-400/70 hover:text-amber-300 transition-colors text-xs">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl font-semibold text-sm
            bg-gradient-to-r from-amber-500 to-amber-600
            text-white shadow-lg shadow-amber-500/25
            hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-500/40
            active:scale-[0.98] transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Spinner className="h-4 w-4" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Demo Accounts */}
      <div className="pt-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
            Quick Demo Access
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => fillDemoCredentials(account.email, account.password)}
              className={`group relative rounded-xl border ${account.border}
                bg-gradient-to-b ${account.gradient}
                backdrop-blur-sm p-3 text-center
                hover:scale-[1.03] hover:shadow-lg hover:shadow-black/20
                active:scale-[0.97] transition-all duration-200`}
            >
              <span className="text-xl block mb-1.5">{account.icon}</span>
              <span className="text-white font-semibold text-xs block">{account.role}</span>
              <span className={`text-[9px] mt-1 inline-block px-2 py-0.5 rounded-full ${account.badge}`}>
                {account.description}
              </span>
              <div className="mt-1.5 text-[9px] text-white/30 font-mono">{account.password}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* ===== BACKGROUND LAYERS ===== */}
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />

      {/* Warm gold ambient glow */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-600/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-amber-700/5 rounded-full blur-[80px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating decorative orbs */}
      <div className="absolute top-20 right-20 w-3 h-3 bg-amber-400/20 rounded-full animate-pulse" />
      <div className="absolute bottom-32 left-16 w-2 h-2 bg-amber-300/15 rounded-full animate-pulse [animation-delay:1s]" />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-white/10 rounded-full animate-pulse [animation-delay:2s]" />

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto px-4 py-8">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          {/* Logo with glass ring */}
          <div className="relative inline-block mb-5">
            <div className="absolute -inset-2 bg-gradient-to-b from-amber-400/20 to-transparent rounded-2xl blur-lg" />
            <div className="relative h-20 w-20 mx-auto rounded-2xl
              bg-white/10 backdrop-blur-md border border-white/20
              shadow-2xl shadow-black/20
              flex items-center justify-center overflow-hidden p-2">
              <Image
                src="/national-logo.png"
                alt="National Group India"
                width={64}
                height={64}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>
          </div>

          {/* Company name with gold gradient */}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-amber-100 to-amber-300 bg-clip-text text-transparent tracking-tight">
            National Group
          </h1>
          <p className="text-white/40 text-xs mt-1 tracking-wider uppercase">
            Enterprise Intranet Portal
          </p>

          {/* Website link */}
          <a
            href="https://nationalgroupindia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-[11px] text-amber-400/50 hover:text-amber-300/80 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            nationalgroupindia.com
          </a>
        </div>

        {/* ===== GLASS CARD ===== */}
        <div className="relative">
          {/* Card glow effect */}
          <div className="absolute -inset-px bg-gradient-to-b from-amber-400/20 via-transparent to-white/5 rounded-2xl" />

          {/* Glass card */}
          <div className="relative rounded-2xl
            bg-white/[0.06] backdrop-blur-xl
            border border-white/[0.08]
            shadow-2xl shadow-black/40
            p-6 sm:p-7">

            {/* Inner top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent rounded-t-2xl" />

            <Suspense fallback={
              <div className="flex justify-center py-12">
                <Spinner className="h-8 w-8 text-amber-400/60" />
              </div>
            }>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-white/20">
            © 2026 National Group India. All rights reserved.
          </p>
          <p className="text-[10px] text-white/10 mt-1">
            Pioneering Infrastructure. Transforming Communities. Since 1949.
          </p>
        </div>
      </div>
    </div>
  );
}
