# National Group Intranet Portal

Enterprise Intranet Application for National Group India

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod
- **Email**: Mailgun
- **File Storage**: Microsoft OneDrive Integration

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Microsoft Azure AD app (for OneDrive)
- Mailgun account

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file with database and API credentials

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Push database schema:
```bash
npm run db:push
```

6. Seed the database:
```bash
npm run db:seed
```

7. Start development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── layout/           # Layout components
│   └── modules/          # Feature-specific components
├── lib/                  # Utilities and configurations
│   ├── db.ts            # Prisma client
│   ├── auth.ts          # NextAuth configuration
│   ├── mailgun.ts       # Mailgun client
│   └── onedrive.ts      # OneDrive integration
├── types/               # TypeScript type definitions
├── validations/         # Zod schemas
└── hooks/               # Custom React hooks
```

## Features

- 🏢 Multi-company organization management
- 👥 Department & employee directory
- 📅 Event calendar with multiple views
- ✅ Task management with assignments
- 📁 OneDrive shared folders integration
- 📊 Project tracking & timelines
- 📋 Policy & document management
- 🖥️ IT service desk & ticketing
- 💻 Asset management (hardware, software, mobile)
- 📧 Email notifications via Mailgun

## Color Theme

- **Primary**: Navy Blue `#070B47`
- **Secondary**: Gray `#6A89A7`
- **Background**: White / Light Gray
- **Success**: Green
- **Warning**: Amber
- **Danger**: Red
