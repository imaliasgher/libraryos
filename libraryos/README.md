# 📚 LibraryOS — Full-Stack Library Management System

A complete, production-ready library management system built with **Next.js 14**, **Prisma**, **Supabase (PostgreSQL)**, and **JWT auth**. Deployable to Vercel in minutes.

---

## ✨ Features

### 🛡️ Admin Portal
- **Dashboard** — live stats, recent activity, genre chart, overdue alerts
- **Books** — full CRUD, issue books to students, stock management
- **Students** — add/edit/suspend students, view profiles
- **Transactions** — issue/return tracking, overdue filtering, live fine calculation
- **Reports** — analytics, top borrowed books, most active students, low stock alerts

### 🎓 Student Portal
- **Home** — personalized dashboard with active loans and countdown timers
- **Browse Books** — searchable, filterable catalogue with one-click borrow
- **My Books** — active / overdue / history tabs with fine display
- **Fines & Dues** — detailed fine breakdown and payment guidance
- **My Profile** — view and edit personal information

### 🔐 Auth
- HttpOnly JWT cookies (7-day sessions)
- Role-based access control (admin / student)
- Bcrypt password hashing
- Suspended account blocking

---

## 🛠️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Framework | Next.js 14 (App Router)             |
| Database  | Supabase (PostgreSQL)               |
| ORM       | Prisma 5                            |
| Auth      | JWT via jose + HttpOnly cookies     |
| Passwords | bcryptjs                            |
| Styling   | Inline styles — zero CSS framework  |
| Deploy    | Vercel                              |

---

## 🚀 Deploy to Vercel with Supabase

### Step 1 — Create a free Supabase project

1. Go to **https://supabase.com** and sign up (free)
2. Click "New project" → set a name + strong Database Password → Create
3. Wait ~2 min for provisioning

### Step 2 — Get your two connection strings

In your Supabase project: **Settings → Database → Connection string → URI tab**

**DATABASE_URL** — click "Transaction pooler" (port 6543), copy and append params:
```
postgresql://postgres.XXXX:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**DIRECT_URL** — click "Session pooler" (port 5432), copy as-is:
```
postgresql://postgres.XXXX:[PASSWORD]@aws-0-region.pooler.supabase.com:5432/postgres
```

### Step 3 — Push schema to Supabase (run once locally)

```bash
npm install
cp .env.example .env.local
# Fill in your URLs in .env.local
npx prisma db push
```

### Step 4 — Push repo to GitHub

```bash
git init && git add . && git commit -m "init"
# Create repo on github.com and push
```

### Step 5 — Deploy on Vercel

1. Go to https://vercel.com/new → import your repo
2. Add these Environment Variables:

| Variable       | Value                                                              |
|----------------|--------------------------------------------------------------------|
| DATABASE_URL   | Transaction pooler URI (port 6543) + ?pgbouncer=true&connection_limit=1 |
| DIRECT_URL     | Session pooler URI (port 5432)                                    |
| JWT_SECRET     | Run: openssl rand -base64 32                                      |
| SEED_SECRET    | Any string e.g. my-seed-2025                                      |

3. Click Deploy

### Step 6 — Seed the database

After deploy, open in browser:
```
https://your-app.vercel.app/api/seed?secret=YOUR_SEED_SECRET
```

### Step 7 — Log in!

| Role    | Email               | Password  |
|---------|---------------------|-----------|
| Admin   | admin@library.edu   | admin123  |
| Student | aarav@uni.edu       | aarav123  |
| Student | priya@uni.edu       | priya123  |
| Student | sneha@uni.edu       | sneha123  |
| Student | rohan@uni.edu       | rohan123  |
| Student | karan@uni.edu       | karan123  |
| Student | ananya@uni.edu      | ananya123 |

---

## 💻 Local Development

```bash
npm install
cp .env.example .env.local   # fill in Supabase URLs
npx prisma db push
node prisma/seed.js
npm run dev
```

---

## 📁 Project Structure

```
libraryos/
├── prisma/
│   ├── schema.prisma       # User, Book, Student, Transaction models
│   └── seed.js             # Local seed script
├── src/
│   ├── app/
│   │   ├── page.tsx        # Root router (login / admin / student)
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── auth/       # login, logout, me
│   │       ├── books/      # CRUD
│   │       ├── students/   # CRUD
│   │       ├── transactions/
│   │       ├── dashboard/
│   │       └── seed/       # Secret-protected DB seeder
│   ├── components/
│   │   ├── shared/         # AuthProvider, LoginScreen, Shell, UI atoms
│   │   ├── admin/          # 5 admin pages
│   │   └── student/        # 5 student pages
│   └── lib/
│       ├── prisma.ts
│       ├── auth.ts         # JWT sign/verify
│       ├── api.ts          # ok() / err() helpers
│       ├── client.ts       # Typed fetch wrappers
│       └── tokens.ts       # Design tokens + helpers
└── .env.example
```

---

## ⚠️ Troubleshooting

**"prepared statement already exists"** — Make sure DATABASE_URL uses port 6543 with ?pgbouncer=true&connection_limit=1

**Tables don't exist after deploy** — Run `npx prisma db push` locally with your Supabase URLs in .env.local

**Seed returns 403** — The ?secret= value must exactly match SEED_SECRET in Vercel env vars

**Login fails with "Invalid credentials"** — Check JWT_SECRET is set in Vercel dashboard

---

## 📝 License

MIT
