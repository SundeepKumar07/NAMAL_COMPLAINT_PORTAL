# NCMMS — Namal Complaint Management System

Phase 1: Database schema, authentication, admin user management.

## What's included (Phase 1)

- MySQL schema (23 tables) via Sequelize migrations
- Lookup seed data (categories, statuses, priorities, buildings, departments)
- Default admin account (from `.env`)
- JWT login for 3 roles — **no public sign-up**
- Admin portal to **create complaint filers** (student/faculty/staff) and **maintenance staff**
- Role-specific login pages and placeholder dashboards

**Not in Phase 1:** complaints, Cloudinary uploads, email, deployment.

## Setup

### 1. MySQL

Create a database:

```sql
CREATE DATABASE ncmms_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Server environment

```bash
cd server
cp .env.example .env
# Edit .env with your MySQL password and JWT_SECRET
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

API runs at `http://localhost:5000`

### 3. Client

```bash
cd client
cp .env.example .env   # optional; defaults to proxy /api
npm install
npm run dev
```

UI runs at `http://localhost:5173`

### 4. Logo

Place your logo at:

```
client/public/namal_logo.png
```

## Default admin (after seed)

| Field | Value |
|-------|-------|
| Email | `admin@namal.edu.pk` |
| Password | `admin123` (or `SEED_ADMIN_PASSWORD` in `.env`) |

Change these in production.

## Phase 1 test checklist

1. **Health:** `GET http://localhost:5000/api/health`
2. **Admin login** at `/login/admin`
3. **User Management** → create a complaint filer (student/faculty/staff)
4. **User Management** → create maintenance staff with categories
5. **Filer login** at `/login/user` with email + university ID
6. **Staff login** at `/login/staff` with email + staff ID
7. Confirm no sign-up page exists; home page explains admin-created accounts

## Project structure

```
ncmms/
├── server/          Express + Sequelize + MySQL
│   └── src/
│       ├── models/
│       ├── migrations/
│       ├── seeders/
│       ├── routes/
│       └── controllers/
└── client/          React + Vite + Tailwind
    └── src/
        ├── pages/
        └── components/
```

## Credentials needed from you (`.env`)

| Variable | When needed |
|----------|-------------|
| `DB_*` | Now (Phase 1) |
| `JWT_SECRET` | Now (Phase 1) |
| `CLOUDINARY_*` | Phase 2 |
| Email/SMTP | Phase 4 (skipped for now) |
