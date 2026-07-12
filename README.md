# TransitOps — Smart Transport Operations Platform

A centralized platform to manage the full lifecycle of transport operations —
vehicle registry, driver management, trip dispatch, maintenance, fuel/expense
tracking, and analytics — with business rules and RBAC enforced by the service
layer, not by human discipline.

> **Status: full stack built and deployed.** A NestJS + Prisma + PostgreSQL API
> backs a React (Vite) frontend. Everything runs on a single EC2 instance behind
> Nginx (`/` → SPA, `/api` → NestJS). See
> [`docs/TECHNICAL_ARCHITECTURE.md`](docs/TECHNICAL_ARCHITECTURE.md) for the full design.

**Live:** http://3.110.169.152

---

## Tech stack

**Frontend** (`/`)
- React 19 + TypeScript + Vite
- Tailwind CSS (dark, glassy theme)
- react-router-dom, axios, motion (Framer Motion), lucide-react

**Backend** (`server/`)
- NestJS 10 (layered modules: controller → service → Prisma)
- Prisma ORM 5 + PostgreSQL 15
- JWT (Passport) + bcrypt auth, class-validator DTOs, `@nestjs/throttler`

**Infra**
- PM2 (API process), Nginx (reverse proxy), PostgreSQL bound to localhost
- Amazon Linux 2023 on EC2; deploy scripted over AWS SSM (`deploy/`, `ssm.ps1`)

---

## Getting started

### Frontend
```bash
npm install
npm run dev        # dev server (proxies /api → deployed backend)
npm run build      # type-check + production build
npm run preview
```

### Backend
```bash
cd server
npm install
cp .env.example .env          # set DATABASE_URL, JWT_SECRET
npm run prisma:generate
npm run prisma:deploy         # apply migrations
npm run seed                  # 4 demo users + sample fleet
npm run start:dev             # API on http://localhost:3000/api
npm test                      # unit tests (trip dispatch guards)
```

---

## Demo logins (RBAC)

Selecting a role on the login screen preselects its credentials.

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | `manager@transitops.io` | `manager123` |
| Driver | `driver@transitops.io` | `driver123` |
| Safety Officer | `safety@transitops.io` | `safety123` |
| Financial Analyst | `finance@transitops.io` | `finance123` |

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/login` | Authentication (RBAC) — real JWT login |
| `/dashboard` | Operations dashboard — live KPIs, alerts, status breakdowns |
| `/fleet` | Vehicle registry — CRUD, lifecycle status, filters |
| `/drivers` | Drivers & safety profiles — license validity, safety scores, CRUD |
| `/trips` | Trip dispatcher — create → dispatch → complete/cancel, guards, live board |
| `/maintenance` | Maintenance — open/close records, IN_SHOP side effects |
| `/fuel-expenses` | Fuel & expense management — logs, cost rollups |
| `/analytics` | Reports & analytics — KPI formulas, charts, CSV export |
| `/settings` | Settings & RBAC — role matrix, security posture |

Authenticated routes render inside a shared app shell (sidebar + topbar) behind an
auth guard; the landing page and `/login` render standalone.

---

## Project structure

```text
src/                         # React frontend
├── App.tsx                  # landing page composition
├── main.tsx                 # router + auth provider + protected routes
├── lib/                     # axios API client + auth context
└── app/
    ├── AppLayout.tsx        # authenticated shell
    ├── ui.tsx               # shared primitives (Card, StatusBadge, Modal, ...)
    └── pages/               # module pages + Login

server/                      # NestJS backend
├── prisma/                  # schema.prisma, migrations/, seed.ts
└── src/
    ├── common/              # guards, filters, decorators, DTOs
    └── modules/             # auth, vehicles, drivers, trips, maintenance,
                             # fuel-expenses, analytics, health

deploy/                      # EC2 provisioning + SSM deploy scripts
docs/TECHNICAL_ARCHITECTURE.md
```

---

## Domain model & enforced rules

- **Enum state machines** — `Vehicle`, `Driver`, and `Trip` statuses drive filters,
  dispatch eligibility, and visualized transitions.
- **Dispatch guards** (service layer, in transactions) — cargo ≤ vehicle max load,
  valid (non-expired) license, driver not SUSPENDED, vehicle/driver not already
  `ON_TRIP`, vehicle not `RETIRED`/`IN_SHOP`; violations → `422`.
- **Cross-entity side effects** — opening maintenance flips a vehicle to `IN_SHOP`
  and removes it from the dispatch pool; completing/cancelling a trip restores both
  vehicle and driver to `AVAILABLE` — all atomic.
- **KPI formulas** — Fleet Utilization, Fuel Efficiency, Operational Cost, and
  Vehicle ROI, computed from live data.
- **RBAC** — Fleet Manager, Driver, Safety Officer, and Financial Analyst roles map
  to a per-module access matrix; reads open to any authenticated user, writes role-scoped.

---

## Git workflow

```text
main
└── develop
    └── feature/*
```

Feature branches open a pull request into `develop`; `develop` merges into `main`
for release. Conventional commits (e.g. `feat(trips): enforce cargo capacity`).

---

## Status

- [x] Frontend landing page + app shell + module pages
- [x] NestJS API + Prisma schema + PostgreSQL (migrations)
- [x] JWT auth + RBAC guards
- [x] Vehicles & Drivers CRUD, Trip dispatch engine, Maintenance, Fuel/Expenses, Analytics
- [x] Frontend wired to REST API (live data, loading/empty/error states)
- [x] Deployed to EC2 (Nginx + PM2 + PostgreSQL)
