import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/workos-auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = searchParams.get('provider'); // google, microsoft, etc.
  
  try {
    const authUrl = await getAuthorizationUrl({
      provider: provider || undefined,
    });

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('SSO initiation error:', error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message || 'SSO initiation failed')}`, request.url)
    );
  }
}
