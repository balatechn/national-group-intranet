# 🏢 National Group Intranet

Enterprise intranet portal for **National Group India** — a centralized platform for company management, employee directory, IT helpdesk, project tracking, and internal collaboration.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?logo=vercel)

🔗 **Live:** [sharepoint.nationalgroupindia.com](https://sharepoint.nationalgroupindia.com)

---

## ✨ Features

### Dashboard
- Personalized greeting with live date, user profile card, and avatar
- Real-time stats from database (employees, companies, departments, tasks, projects)
- Quick Access grid for fast navigation to all modules
- Stat cards with Active Employees, Active Projects, Tasks In Progress, and Completion Rate
- Task completion & project progress rings (My Goals)
- Recent tasks, upcoming events, active projects feed
- Organization summary sidebar with direct links
- Resilient data loading with graceful error handling

### Company Management
- Multi-company hierarchy support
- Create, edit, delete companies
- Search and filter with quick actions
- Bulk upload via Excel

### Employee Directory
- Complete employee profiles with department & company mapping
- **Inline Edit** — Edit any employee directly from the Employees page via a full-featured dialog (Employee ID, Email, Name, Phone, Job Title, Role, Status, Company, Department, Reporting Manager)
- **Admin Password Reset** — Admins can reset any employee's password from the Edit Employee dialog with confirmation and validation
- **Add Employee** — Full creation form with all fields including initial password
- Role-based access (Super Admin, Admin, IT Admin, HR Admin, Manager, Employee)
- Grid view, table view, and org chart view
- Avatar support and employee ID tracking
- Bulk import from Excel spreadsheets with sample template download

### Department Management
- Department hierarchy within companies
- Member listing and department-level views
- Department head assignment

### IT Helpdesk
- **IT Tickets** — Create, track, assign, and resolve support tickets with priority levels
- **IT Requests** — Hardware/software/access request workflow with approval chains
- **Masters** — Manage systems, software, mobile devices, and vendor inventory
- **Reports** — IT analytics and reporting dashboard

### Task Management
- Create and assign tasks with priority, due dates, and project linking
- Task status workflow (Todo → In Progress → Completed)
- Subtasks, comments, and time tracking
- Bulk operations (status update, assign, delete)
- Task templates and analytics

### Project Management
- **Advanced Project Creation Wizard** — 4-step guided flow: Basic Info → Team → Milestones → Review
- Project creation with milestones and team members
- Status tracking (Planned → Active → On Hold → Completed)
- Company-linked project organization
- Owner and member management

### Additional Modules
- 📅 **Calendar** — Events and meetings management
- 📁 **Shared Drives** — Company document management (OneDrive integration)
- 📜 **Policies** — HR & IT policy repository
- ⚙️ **Settings** — Organization branding (company name & logo upload)

---

## 🛡️ Authentication

- **Credentials Login** — Email/password with bcrypt hashing
- **Microsoft 365 SSO** — Azure AD integration for enterprise sign-in
- **Role-Based Access Control** — 6 user roles with granular permissions
- **JWT Sessions** — 30-day session persistence

### User Roles

| Role         | Access Level                                         |
|--------------|------------------------------------------------------|
| Super Admin  | Full system access, all modules                      |
| Admin        | Company-wide management, employee & settings control |
| IT Admin     | IT Helpdesk, tickets, requests, asset management     |
| HR Admin     | Employee management, departments, policies           |
| Manager      | Team tasks, projects, department oversight            |
| Employee     | Personal tasks, profile, company resources            |

---

## 🏗️ Tech Stack

| Layer        | Technology                                              |
|--------------|--------------------------------------------------------|
| Framework    | Next.js 14.1.3 (App Router, Server Components)        |
| Language     | TypeScript 5.3 (strict mode)                           |
| Database     | PostgreSQL (via Vercel Postgres)                        |
| ORM          | Prisma 5.10 (39 models)                                |
| Auth         | NextAuth.js 4 (Credentials + Azure AD)                 |
| Styling      | Tailwind CSS 3.4 + Radix UI primitives                 |
| Icons        | Lucide React                                            |
| Forms        | React Hook Form + Zod validation                       |
| Tables       | TanStack Table v8                                       |
| State        | Zustand + TanStack React Query                         |
| Charts       | Recharts                                                |
| Email        | Mailgun + Nodemailer                                    |
| File Storage | Microsoft OneDrive integration                         |
| File Export  | xlsx (SheetJS)                                          |
| Deployment   | Vercel (Region: Mumbai `bom1`)                         |

---

## 📁 Project Structure

```
src/
├── actions/            # Server actions (companies, users, tasks, tickets, etc.)
├── app/
│   ├── (dashboard)/    # Authenticated pages
│   │   ├── dashboard/      # Home dashboard with stats & quick access
│   │   ├── companies/      # Company management
│   │   ├── departments/    # Department management with member views
│   │   ├── employees/      # Employee directory with edit & password reset
│   │   ├── projects/       # Project listing & advanced creation wizard
│   │   ├── tasks/          # Task management with detail views
│   │   ├── calendar/       # Events & meetings
│   │   ├── drives/         # Shared document drives
│   │   ├── it/             # IT Helpdesk (tickets, requests, masters, reports)
│   │   ├── policies/       # Policy repository
│   │   ├── profile/        # User profile
│   │   └── settings/       # Organization branding settings
│   ├── api/            # API routes (auth, CRUD, settings, bulk operations)
│   └── login/          # Login page with glassmorphism UI
├── components/
│   ├── bulk-upload/    # Excel bulk upload modal
│   ├── layout/         # Sidebar & Header
│   ├── masters/        # Action components (Add/Edit/Bulk for each entity)
│   └── ui/             # Reusable UI components (Button, Card, Dialog, etc.)
├── lib/
│   ├── auth.ts         # NextAuth configuration (Credentials + Azure AD)
│   ├── db.ts           # Prisma client singleton
│   ├── mailgun.ts      # Mailgun email client
│   ├── onedrive.ts     # OneDrive integration
│   ├── excel.ts        # Excel import/export utilities
│   └── utils.ts        # General utilities (cn, formatters)
├── types/              # NextAuth type declarations
└── validations/        # Zod schemas for form validation

prisma/
├── schema.prisma       # Database schema (39 models)
└── seed.ts             # Seed data (demo accounts, companies, departments)
```

---

## 🗄️ Database Models

The schema includes **39 Prisma models** organized across these domains:

| Domain       | Models                                                                 |
|--------------|------------------------------------------------------------------------|
| Users        | User, Session                                                          |
| Organization | Company, Department                                                    |
| Tasks        | Task, TaskComment, TaskTemplate, TaskAttachment, TaskDependency, TaskTimeEntry, TaskMention |
| Projects     | Project, ProjectMember, ProjectMilestone                               |
| Calendar     | Event, EventAttendee                                                   |
| Policies     | Policy, PolicyVersion                                                  |
| IT Helpdesk  | ITTicket, TicketComment, ITRequest, ITRequestApproval                  |
| IT Assets    | SystemAsset, Software, AssetSoftware, MobileDevice, Vendor             |
| Drives       | SharedFolder, FolderPermission                                         |
| System       | Notification, AuditLog, Announcement, RolePermission, SystemSetting    |
| Chat         | ChatRoom, ChatMember, ChatMessage                                      |

---

## 🚀 Getting Started

### Prerequisites

- Node.js **20.x**
- PostgreSQL database
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/balatechn/national-group-intranet.git
cd national-group-intranet
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root:

```env
# Database
POSTGRES_URL="postgresql://user:password@host:5432/national_group"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Azure AD (optional — for Microsoft 365 SSO)
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# Mailgun (optional — for email notifications)
MAILGUN_API_KEY=""
MAILGUN_DOMAIN=""

# App
APP_URL="http://localhost:3000"
```

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed demo data
npx prisma db seed
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the portal.

---

## 📜 Available Scripts

| Command               | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev`         | Start development server             |
| `npm run build`       | Production build                     |
| `npm run start`       | Start production server              |
| `npm run lint`        | Run ESLint                           |
| `npm run db:generate` | Generate Prisma client               |
| `npm run db:push`     | Push schema changes to database      |
| `npm run db:migrate`  | Run database migrations              |
| `npm run db:studio`   | Open Prisma Studio (visual DB editor)|
| `npm run db:seed`     | Seed database with demo data         |

---

## 🌐 Deployment

Deployed on **Vercel** with the following configuration:

- **Domain:** [sharepoint.nationalgroupindia.com](https://sharepoint.nationalgroupindia.com)
- **Region:** Mumbai (`bom1`)
- **Node.js:** 20.x
- **Build Command:** `prisma generate && next build`
- **Framework:** Next.js (auto-detected)
- **Auto-deploy:** Pushes to `main` branch trigger automatic deployments

---

## 🎨 Design System

| Token            | Value                                    |
|------------------|------------------------------------------|
| Primary          | Rich Gold `#B8860B`                      |
| Secondary        | Goldenrod `#DAA520`                      |
| Background       | Light Surface `slate-50` to `white`      |
| Cards            | `white/80` with `backdrop-blur-xl`       |
| Borders          | `gray-200/80` with subtle shadows        |
| UI Style         | Glassmorphism accents, gradient cards    |
| Branding         | National Group India logo throughout     |
| Responsive       | Mobile-first with lg breakpoint grid     |

---

## 📄 License

This project is private and proprietary to **National Group India**.

---

<p align="center">
  Built with ❤️ for <strong>National Group India</strong> · <a href="https://nationalgroupindia.com">nationalgroupindia.com</a>
</p>
