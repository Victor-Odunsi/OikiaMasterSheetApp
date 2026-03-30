# Church Usher Management System — Frontend

A Next.js 15 frontend for managing church members and attendance.

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment variables
cp .env.local.example .env.local
# Edit .env.local to point to your API

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Sign in with email + password |
| `/forgot-password` | Request a password reset email |
| `/reset-password/[token]` | Set a new password via token |
| `/dashboard` | Stats, attendance trend chart, recent activity |
| `/members` | List all members, search, refresh cache |
| `/members/new` | Register a new member |
| `/members/[id]` | View member details + attendance history |
| `/members/[id]/edit` | Edit member information |
| `/attendance` | Mark/unmark attendance, bulk actions |
| `/users` | Admin-only: manage system users |
| `/profile` | Change your own password |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout (providers, fonts)
│   ├── page.tsx            # Redirects → /dashboard
│   ├── login/
│   ├── forgot-password/
│   ├── reset-password/[token]/
│   ├── dashboard/
│   ├── members/
│   │   ├── page.tsx        # Member list
│   │   ├── new/page.tsx    # Add member
│   │   └── [id]/
│   │       ├── page.tsx    # View member
│   │       └── edit/page.tsx
│   ├── attendance/
│   ├── users/
│   └── profile/
├── components/
│   ├── forms/
│   │   └── MemberForm.tsx  # Shared form for add/edit member
│   ├── layout/
│   │   ├── Sidebar.tsx     # Navigation sidebar (responsive)
│   │   └── DashboardLayout.tsx  # Auth-guarded layout wrapper
│   ├── shared/
│   │   ├── index.tsx       # LoadingSpinner, ErrorMessage, EmptyState, PageHeader
│   │   └── ThemeToggle.tsx # Light/dark toggle button
│   └── ui/
│       └── index.tsx       # Button, Input, Select, Card, Badge
├── contexts/
│   └── AuthContext.tsx     # Auth state + login/logout
└── lib/
    ├── api/                # All API clients
    │   ├── client.ts       # Axios instance w/ token refresh
    │   ├── auth.ts
    │   ├── attendance.ts
    │   ├── dashboard.ts
    │   ├── members.ts
    │   ├── password.ts
    │   └── users.ts
    ├── hooks/
    │   └── useApiData.ts   # Generic data-fetching hook
    ├── types.ts            # All TypeScript interfaces
    └── utils.ts            # cn(), formatDate(), getInitials(), getErrorMessage()
```

## Features

- **Light/Dark mode** — toggle in sidebar footer, persisted by `next-themes`
- **JWT auth** — stored in `localStorage`, auto-refreshed via Axios interceptor
- **Cache refresh** — button on Members and Attendance pages
- **Bulk attendance** — select members → mark all present/absent at once
- **Admin-only** — Users page hidden from non-admin users
- **Responsive** — mobile drawer sidebar, responsive tables

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 3
- react-hook-form + Zod
- Axios
- next-themes
- Recharts (attendance trend chart)
- Sonner (toast notifications)
- Lucide React (icons)
