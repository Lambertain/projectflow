# ProjectFlow - AI-Powered Business Management Platform

**CONFIDENTIAL: This project is the foundation for a multi-tenant SaaS application. All code should be written with scalability and reusability in mind.**

---

## 🚀 Project Overview

ProjectFlow is a multi-tenant SaaS platform designed to help small and medium-sized businesses automate their financial accounting, asset management, and tax compliance. It features a powerful AI engine for data migration and analysis, and is built on a modern, scalable technology stack.

- **Primary Tech Stack:** Next.js, TypeScript, Prisma, PostgreSQL, Tailwind CSS
- **Architecture:** Multi-tenant, with data isolated by `Workspace`.
- **Live Documentation:** For the high-level strategic plan, see `../gemini_inbox/Unified_Roadmap_and_Architecture_Plan.md`.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- PostgreSQL database
- An `.env` file (see below)

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd projectflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a file named `.env` in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Now, fill in the variables in your new `.env` file:

```env
# PostgreSQL Database URL
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="your_postgres_connection_string"

# NextAuth.js Configuration
# Generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# External Service API Keys
OPENAI_API_KEY="your_openai_api_key"
GOOGLE_VISION_API_KEY="your_google_vision_api_key"
```

### 4. Apply database migrations

This will set up all the necessary tables in your PostgreSQL database based on the Prisma schema.

```bash
npx prisma migrate dev --name "initial-setup"
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🏗️ Core Architectural Concepts

### Multi-Tenancy

- The core of the architecture is the `Workspace` model.
- **All data is strictly isolated by `workspaceId`.**
- Every database query that accesses tenant-specific data (like `Transaction` or `Asset`) **must** include a `where: { workspaceId: ... }` clause.
- Data access logic is centralized to enforce this rule.

### Authentication & Authorization

- Handled by `NextAuth.js`.
- The user's `session` object contains their `userId`, `role`, and `workspaceId`.
- Role-Based Access Control (RBAC) is implemented at the API level based on the `role` in the session.

## 📂 Project Structure

```
/src
├── /app                  # Next.js App Router: Pages and Layouts
│   ├── (auth)            # Auth-related pages (login, register)
│   ├── (dashboard)       # Main application dashboard, protected routes
│   │   ├── /api          # API routes, protected by auth middleware
│   │   └── /_components  # UI components specific to the dashboard
│   └── layout.tsx
├── /components           # Global, reusable UI components (buttons, inputs, etc.)
├── /lib                  # Core logic and helper functions
│   ├── prisma.ts         # Centralized Prisma client and data access functions
│   ├── auth.ts           # NextAuth configuration and options
│   └── utils.ts          # Utility functions
├── /styles               # Global styles, Tailwind CSS config
└── /types                # TypeScript type definitions
/prisma
└── schema.prisma         # The single source of truth for the database schema
```

---

## ✅ Running Tests

*Testing framework to be determined (TBD). Recommended: Jest + React Testing Library.*

```bash
# Example command (once configured)
npm run test
```

## 🚀 Deployment

This project is optimized for deployment on platforms like Vercel or AWS Amplify.

1.  Push your code to a Git repository (GitHub, GitLab).
2.  Import the project into your hosting provider.
3.  **Crucially, set up all the environment variables from your `.env` file in the hosting provider's settings.**
4.  The deployment should build automatically.
