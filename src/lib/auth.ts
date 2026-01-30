import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { compare } from 'bcryptjs';
import prisma from '@/lib/db';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    // Microsoft 365 / Azure AD SSO
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || '',
      authorization: {
        params: {
          scope: 'openid profile email User.Read',
        },
      },
    }),
    // Email/Password credentials
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
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

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
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
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Microsoft SSO sign-in
      if (account?.provider === 'azure-ad') {
        const email = user.email;
        if (!email) {
          return false;
        }

        // Check if user exists in our database
        let dbUser = await prisma.user.findUnique({
          where: { email },
          include: {
            company: { select: { id: true, name: true, code: true } },
            department: { select: { id: true, name: true, code: true } },
          },
        });

        // If user doesn't exist, create them (auto-provision from Microsoft 365)
        if (!dbUser) {
          // Get the first company as default
          const defaultCompany = await prisma.company.findFirst({
            where: { isActive: true },
          });

          // Parse name from profile
          const azureProfile = profile as any;
          const firstName = azureProfile?.given_name || user.name?.split(' ')[0] || 'User';
          const lastName = azureProfile?.family_name || user.name?.split(' ').slice(1).join(' ') || '';

          // Generate employee ID
          const userCount = await prisma.user.count();
          const employeeId = `EMP${String(userCount + 1).padStart(5, '0')}`;

          dbUser = await prisma.user.create({
            data: {
              email,
              employeeId,
              firstName,
              lastName,
              displayName: user.name || `${firstName} ${lastName}`,
              password: '', // No password for SSO users
              role: 'EMPLOYEE',
              status: 'ACTIVE',
              avatar: user.image,
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
          return false;
        }

        // Update last login and avatar
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { 
            lastLoginAt: new Date(),
            avatar: user.image || dbUser.avatar,
          },
        });

        return true;
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      // For Microsoft SSO, fetch user data from database
      if (account?.provider === 'azure-ad' && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: {
            company: { select: { id: true, name: true, code: true } },
            department: { select: { id: true, name: true, code: true } },
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.displayName || `${dbUser.firstName} ${dbUser.lastName}`;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.employeeId = dbUser.employeeId;
          token.role = dbUser.role;
          token.avatar = dbUser.avatar;
          token.companyId = dbUser.companyId;
          token.companyName = dbUser.company?.name || null;
          token.departmentId = dbUser.departmentId;
          token.departmentName = dbUser.department?.name || null;
          token.provider = 'azure-ad';
        }
      } else if (user) {
        // For credentials provider
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.employeeId = user.employeeId;
        token.role = user.role;
        token.avatar = user.avatar;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
        token.departmentId = user.departmentId;
        token.departmentName = user.departmentName;
        token.provider = 'credentials';
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.employeeId = token.employeeId as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
        session.user.companyId = token.companyId as string | null;
        session.user.companyName = token.companyName as string | null;
        session.user.departmentId = token.departmentId as string | null;
        session.user.departmentName = token.departmentName as string | null;
      }
      return session;
    },
  },
};
