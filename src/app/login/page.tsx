'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/validations';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { CompanyLogo } from '@/components/ui/company-logo';

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get('error'));
  const [isLoading, setIsLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setIsMicrosoftLoading(true);
    setError(null);
    
    try {
      await signIn('azure-ad', { callbackUrl: '/dashboard' });
    } catch (err) {
      setError('Failed to sign in with Microsoft. Please try again.');
      setIsMicrosoftLoading(false);
    }
  };

  return (
    <Card className="shadow-modal border-t-4 border-t-primary">
      <CardHeader className="text-center">
        <CardTitle className="text-primary">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-md bg-danger-light p-3 text-sm text-danger-dark">
            {error === 'OAuthAccountNotLinked' 
              ? 'This email is already registered with a different sign-in method.'
              : error === 'AccessDenied'
              ? 'Access denied. Your account may not be active.'
              : error}
          </div>
        )}

        {/* Microsoft SSO Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 text-base font-medium border-2 hover:bg-gray-50"
          onClick={handleMicrosoftSignIn}
          disabled={isMicrosoftLoading}
        >
          {isMicrosoftLoading ? (
            <svg className="mr-3 h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <MicrosoftLogo className="mr-3 h-5 w-5" />
          )}
          Sign in with Microsoft 365
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-text-muted">Or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-group">
            <Label htmlFor="email" required>
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@nationalgroup.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className="form-group">
            <Label htmlFor="password" required>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Remember me
            </label>
            <a href="#" className="text-sm text-primary hover:underline">
              Forgot password?
            </a>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign in with Email
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-secondary to-primary-400 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-lg p-2">
            <CompanyLogo width={64} height={64} className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow-md">National Group</h1>
          <p className="text-primary-100">Enterprise Intranet Portal</p>
        </div>

        {/* Login Card */}
        <Suspense fallback={
          <Card className="shadow-modal border-t-4 border-t-primary">
            <CardContent className="p-8">
              <div className="flex justify-center">
                <svg className="h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            </CardContent>
          </Card>
        }>
          <LoginForm />
        </Suspense>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-primary-200">
          © 2026 National Group India. All rights reserved.
        </p>
      </div>
    </div>
  );
}
