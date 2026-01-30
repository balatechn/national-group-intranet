import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
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
    async jwt({ token, user }) {
      if (user) {
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
