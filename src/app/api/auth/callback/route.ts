import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithCode } from '@/lib/workos-auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle errors from WorkOS
  if (error) {
    console.error('WorkOS auth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  // Require authorization code
  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=No authorization code received', request.url)
    );
  }

  try {
    // Exchange code for user session
    await authenticateWithCode(code);

    // Redirect to dashboard on success
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error: any) {
    console.error('Authentication callback error:', error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || 'Authentication failed')}`, request.url)
    );
  }
}
