import { UserRole } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
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
    };
  }

  interface User {
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
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
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
  }
}
