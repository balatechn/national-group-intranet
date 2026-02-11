'use server';

import { WorkOS } from '@workos-inc/node';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import prisma from '@/lib/db';

// Lazy WorkOS client initialization (to avoid build-time errors)
let _workos: WorkOS | null = null;

function getWorkOS(): WorkOS {
  if (!_workos) {
    const apiKey = process.env.WORKOS_API_KEY;
    if (!apiKey) {
      throw new Error('WORKOS_API_KEY environment variable is not set');
    }
    _workos = new WorkOS(apiKey);
  }
  return _workos;
}

function getClientId(): string {
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!clientId) {
    throw new Error('WORKOS_CLIENT_ID environment variable is not set');
  }
  return clientId;
}

// JWT secret for session tokens
const JWT_SECRET = new TextEncoder().encode(
  process.env.WORKOS_COOKIE_PASSWORD || process.env.NEXTAUTH_SECRET || 'your-secret-key-min-32-chars-long!!'
);

const COOKIE_NAME = 'workos_session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

// Session user interface
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  role: string;
  avatar: string | null;
  companyId: string | null;
  companyName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  provider: 'workos' | 'credentials';
}

export interface Session {
  user: SessionUser;
  accessToken?: string;
  expiresAt: number;
}

// Get authorization URL for SSO
export async function getAuthorizationUrl(options?: {
  provider?: string;
  organizationId?: string;
  redirectUri?: string;
  state?: string;
}) {
  const redirectUri = options?.redirectUri || `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/callback`;
  
  // If provider is specified, use OAuth flow
  if (options?.provider) {
    const url = getWorkOS().userManagement.getAuthorizationUrl({
      clientId: getClientId(),
      redirectUri,
      provider: options.provider as any,
      state: options?.state,
    });
    return url;
  }

  // Default to AuthKit hosted UI
  const url = getWorkOS().userManagement.getAuthorizationUrl({
    clientId: getClientId(),
    redirectUri,
    state: options?.state,
  });
  
  return url;
}

// Exchange authorization code for user info
export async function authenticateWithCode(code: string) {
  try {
    const { user, accessToken, refreshToken } = await getWorkOS().userManagement.authenticateWithCode({
      clientId: getClientId(),
      code,
    });

    // Find or create user in our database
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      include: {
        company: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });

    if (!dbUser) {
      // Get the first active company as default
      const defaultCompany = await prisma.company.findFirst({
        where: { isActive: true },
      });

      // Generate employee ID
      const userCount = await prisma.user.count();
      const employeeId = `EMP${String(userCount + 1).padStart(5, '0')}`;

      dbUser = await prisma.user.create({
        data: {
          email: user.email,
          employeeId,
          firstName: user.firstName || user.email.split('@')[0],
          lastName: user.lastName || '',
          displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          password: '', // No password for SSO users
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          avatar: user.profilePictureUrl,
          companyId: defaultCompany?.id,
        },
        include: {
          company: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      });
    }

    // Check if user is active
    if (dbUser.status !== 'ACTIVE') {
      throw new Error('Your account is not active. Please contact administrator.');
    }

    // Update last login
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        lastLoginAt: new Date(),
        avatar: user.profilePictureUrl || dbUser.avatar,
      },
    });

    // Create session
    const session: Session = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.displayName || `${dbUser.firstName} ${dbUser.lastName}`,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        employeeId: dbUser.employeeId,
        role: dbUser.role,
        avatar: dbUser.avatar,
        companyId: dbUser.companyId,
        companyName: dbUser.company?.name || null,
        departmentId: dbUser.departmentId,
        departmentName: dbUser.department?.name || null,
        provider: 'workos',
      },
      accessToken,
      expiresAt: Date.now() + COOKIE_MAX_AGE * 1000,
    };

    // Create and set session cookie
    await setSessionCookie(session);

    return { success: true, user: session.user };
  } catch (error: any) {
    console.error('WorkOS authentication error:', error);
    throw new Error(error.message || 'Authentication failed');
  }
}

// Authenticate with email/password (credentials)
export async function authenticateWithPassword(email: string, password: string) {
  const { compare } = await import('bcryptjs');

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      company: { select: { id: true, name: true, code: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  if (user.status !== 'ACTIVE') {
    throw new Error('Your account is not active. Please contact administrator.');
  }

  const isPasswordValid = await compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Create session
  const session: Session = {
    user: {
      id: user.id,
      email: user.email,
      name: user.displayName || `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      employeeId: user.employeeId,
      role: user.role,
      avatar: user.avatar,
      companyId: user.companyId,
      companyName: user.company?.name || null,
      departmentId: user.departmentId,
      departmentName: user.department?.name || null,
      provider: 'credentials',
    },
    expiresAt: Date.now() + COOKIE_MAX_AGE * 1000,
  };

  // Create and set session cookie
  await setSessionCookie(session);

  return { success: true, user: session.user };
}

// Create JWT session token
async function createSessionToken(session: Session): Promise<string> {
  const token = await new SignJWT({ session })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);

  return token;
}

// Set session cookie
async function setSessionCookie(session: Session) {
  const token = await createSessionToken(session);
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

// Get current session
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload.session as Session;

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      await clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

// Get session user (convenience function)
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session?.user || null;
}

// Clear session (logout)
export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Logout and redirect
export async function signOut(redirectTo = '/login') {
  await clearSession();
  redirect(redirectTo);
}

// Require authentication (use in server components/actions)
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  
  if (!user) {
    redirect('/login');
  }

  return user;
}

// Check if user has required role
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    redirect('/dashboard?error=unauthorized');
  }

  return user;
}
