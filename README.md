# TransitOps — Smart Transport Operations Platform

A centralized platform to manage the full lifecycle of transport operations —
vehicle registry, driver management, trip dispatch, maintenance, fuel/expense
tracking, and analytics — with business rules and RBAC enforced by the service
layer, not by human discipline.

> This repository currently contains the **web frontend**. The NestJS + Prisma +
> PostgreSQL backend described in the architecture is planned; the UI runs on
> representative mock data and is ready to be wired to the REST API.

---

## Tech stack (frontend)

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling (dark, glassy theme)
- **react-router-dom** for routing
- **motion** (Framer Motion) for animation
- **lucide-react** for icons

Planned backend: **NestJS** (layered modules), **Prisma ORM**, **PostgreSQL**,
**JWT + Passport + bcrypt** auth. See the architecture design for details.

---

## Getting started

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# type-check + production build
npm run build

# preview the production build
npm run preview
```

The app runs at the URL Vite prints (default `http://localhost:5173`).

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Marketing landing page |
| `/login` | Authentication (RBAC) — placeholder, wired to real auth later |
| `/dashboard` | Operations dashboard — KPIs, alerts, status breakdowns |
| `/fleet` | Vehicle registry — lifecycle status, cost, ROI |
| `/drivers` | Drivers & safety profiles — license validity, safety scores |
| `/trips` | Trip dispatcher — lifecycle, dispatch guards, live board |
| `/maintenance` | Maintenance — open/closed records, IN_SHOP side effects |
| `/fuel-expenses` | Fuel & expense management — cost rollups |
| `/analytics` | Reports & analytics — KPI formulas, charts, export |
| `/settings` | Settings & RBAC — role matrix, security posture |

The authenticated routes render inside a shared app shell (sidebar + topbar);
the landing page and `/login` render standalone.

---

## Project structure

```text
src/
├── App.tsx                 # landing page composition
├── main.tsx                # router + route definitions
├── index.css               # theme tokens, fonts, liquid-glass utility
├── components/             # landing sections (Hero, Pricing, etc.)
└── app/
    ├── AppLayout.tsx       # authenticated shell (sidebar + topbar)
    ├── ui.tsx              # shared UI primitives (Card, StatusBadge, ...)
    └── pages/              # the 8 module pages + Login
```

---

## Domain model (from the architecture)

The UI is built around the real entity graph and its enforced rules:

- **Enum state machines** — `Vehicle`, `Driver`, and `Trip` statuses drive filters,
  dispatch eligibility, and visualized transitions.
- **Dispatch guards** — cargo ≤ vehicle max load, valid (non-expired) license,
  driver/vehicle not already `ON_TRIP`; all checked before dispatch.
- **Cross-entity side effects** — opening maintenance flips a vehicle to `IN_SHOP`
  and removes it from the dispatch pool; completing a trip restores both vehicle
  and driver to `AVAILABLE`.
- **KPI formulas** — Fleet Utilization, Fuel Efficiency, Operational Cost, and
  Vehicle ROI are surfaced with their definitions on the analytics page.
- **RBAC** — Fleet Manager, Dispatcher, Safety Officer, and Financial Analyst
  roles map to a per-module access matrix.

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

- [x] Frontend landing page
- [x] App shell + 8 module pages (mock data)
- [ ] NestJS API + Prisma schema + PostgreSQL
- [ ] JWT auth + RBAC guards
- [ ] Wire frontend to REST API
