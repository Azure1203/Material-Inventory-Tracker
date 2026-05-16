# BUILDSTATE.md

> Living snapshot of the Netley Millwork Material Database app. **Update this file after every change** (see `AGENTS.md`).

---

## 1. App Overview & Current Stage

**Netley Millwork Material Database** is a materials inventory catalog web app for tracking building materials (melamine, TFL panels, etc.) sourced from various suppliers and manufacturers. It is a public-facing reference catalog (not a live inventory system) with a 3-tier stock classification:

- **Stocked At Netley Millwork** — always available
- **Local Stock, 2–3 Week Leadtime** — locally available with short lead time
- **Non-Stock, 6–12 Week Leadtime** — special order

Users can browse, search and filter materials by manufacturer, supplier, color collection, product group, cost level, and stock status. Admins (password-gated) can create/edit/delete materials, suppliers, manufacturers, color collections, product groups, and upload material/logo images backed by Replit Object Storage (GCS).

**Current Stage:** Production / live. Core features are complete and deployed. Ongoing work focuses on security patching of dependencies and small UX refinements.

---

## 2. Build Snapshot

- **Last Updated:** 2026-05-16 14:43 UTC
- **Node entry points:**
  - Dev: `npm run dev` → `tsx server/index.ts` (Express + Vite middleware on port 5000)
  - Build: `npm run build` → `tsx script/build.ts` (esbuild server → `dist/index.cjs`, Vite client → `dist/public`)
  - Prod: `npm start` → `node dist/index.cjs`
  - DB schema push: `npm run db:push` → `drizzle-kit push`
- **Frontend entry:** `client/src/main.tsx` → `client/src/App.tsx`
- **Backend entry:** `server/index.ts` → `server/routes.ts` + `server/storage.ts`
- **Shared types:** `shared/schema.ts` (Drizzle tables + Zod schemas)

### Runtime / Tooling
- Node.js 20, TypeScript 5.6.3
- Vite 7, esbuild 0.25
- PostgreSQL via `DATABASE_URL`
- Replit Object Storage (GCS sidecar at `127.0.0.1:1106`)

### Key Dependencies (current versions)
| Package | Version | Notes |
|---|---|---|
| react / react-dom | ^18.3.1 | Frontend framework |
| wouter | ^3.3.5 | Client routing |
| @tanstack/react-query | ^5.60.5 | Server state / caching |
| react-hook-form | ^7.55.0 | Forms |
| zod | ^3.24.2 | Validation (shared) |
| drizzle-orm | ^0.45.2 | ORM (security-patched) |
| drizzle-zod | ^0.7.0 | Zod schema generation |
| drizzle-kit | ^0.31.8 | Migrations |
| express | ^5.0.1 | HTTP server |
| express-session | ^1.19.0 | Admin session |
| pg | ^8.16.3 | Postgres driver |
| @google-cloud/storage | ^7.19.0 | Object storage |
| @uppy/core, dashboard, aws-s3, react | ^5.x | Upload UI |
| tailwindcss | ^3.4.17 | Styling |
| lucide-react | ^0.453.0 | Icons |
| recharts | ^2.15.2 | Charts |
| sharp | ^0.34.5 | Image processing |
| **fast-xml-parser** | ^5.7.2 | Pinned (security patch) |
| **minimatch** | ^10.2.5 | Pinned (security patch) |
| **picomatch** | ^4.0.4 | Pinned (security patch) |

Full list lives in `package.json`. Do **not** edit `package.json` directly — use `installLanguagePackages`.

---

## 3. File & Folder Structure (annotated)

```
.
├── BUILDSTATE.md              # This file — living build snapshot
├── AGENTS.md                  # Standing rules for agents working on this repo
├── replit.md                  # Architecture + design decisions (long-term memory)
├── package.json               # Dependencies + npm scripts (do not hand-edit)
├── package-lock.json          # Locked dependency tree
├── drizzle.config.ts          # Drizzle Kit config (DB migrations)
├── tailwind.config.ts         # Tailwind theme (brand colors, Poppins font)
├── postcss.config.js          # PostCSS pipeline
├── tsconfig.json              # TypeScript config + path aliases
├── vite.config.ts             # Vite build/dev config
├── components.json            # shadcn/ui registry config
│
├── client/                    # Frontend (React + Vite)
│   ├── index.html             # HTML shell — sets "Netley Millwork | Material Database" title
│   └── src/
│       ├── main.tsx           # React entry, mounts <App />
│       ├── App.tsx            # Router, providers, sidebar layout, header
│       ├── index.css          # Tailwind base + brand CSS variables
│       ├── pages/
│       │   ├── Dashboard.tsx          # Stats + browse-by-manufacturer/supplier/group/cost
│       │   ├── Materials.tsx          # Materials table, filters, detail dialog launch
│       │   ├── Manufacturers.tsx      # Manufacturer list w/ logos + CRUD
│       │   ├── Suppliers.tsx          # Supplier list w/ logos + CRUD
│       │   ├── ColorRanges.tsx        # Color collection CRUD
│       │   ├── ProductGroups.tsx      # Product group CRUD
│       │   └── not-found.tsx          # 404 page
│       ├── components/
│       │   ├── AppSidebar.tsx         # Charcoal sidebar w/ Netley logo + nav
│       │   ├── AdminLoginDialog.tsx   # Admin password dialog
│       │   ├── MaterialDialog.tsx     # Create/edit material form
│       │   ├── MaterialDetailDialog.tsx # Read-only material detail view
│       │   ├── ObjectUploader.tsx     # Uppy-based image upload (presigned URLs)
│       │   ├── ThemeToggle.tsx        # Light/dark mode toggle
│       │   └── ui/                    # shadcn/ui primitives
│       ├── hooks/                     # use-toast, use-mobile, useAdminAuth, etc.
│       └── lib/                       # queryClient, utils
│
├── server/                    # Backend (Express + Drizzle)
│   ├── index.ts               # Express bootstrap, session, vite middleware
│   ├── routes.ts              # All /api/* routes (auth, materials, suppliers, etc.)
│   ├── storage.ts             # IStorage interface + Drizzle implementation
│   ├── db.ts                  # Drizzle DB client (pg pool)
│   ├── seed.ts                # Initial DB seed (idempotent)
│   ├── vite.ts                # Vite dev middleware integration
│   ├── static.ts              # Static asset serving in production
│   └── replit_integrations/
│       └── object_storage/    # Presigned URL + GCS proxy + image cache
│
├── shared/
│   └── schema.ts              # Drizzle tables, insert schemas, types, STOCK_STATUS constants
│
├── script/
│   └── build.ts               # Production build orchestrator
│
├── attached_assets/           # User-uploaded reference assets (logos, screenshots)
└── dist/                      # Production build output (generated)
```

---

## 4. Feature Status

| Feature | Status | Notes |
|---|---|---|
| Materials CRUD | ✅ Done | Full create/edit/delete, image upload, multi-product-group |
| Suppliers CRUD + logos | ✅ Done | Logo upload via presigned URLs |
| Manufacturers CRUD + logos | ✅ Done | Logo upload via presigned URLs |
| Color Collections CRUD | ✅ Done | Linked to manufacturer |
| Product Groups CRUD | ✅ Done | Many-to-many w/ materials |
| Material Sizes (W × L @ thickness) | ✅ Done | Per-material variable size options |
| Storage System Type # | ✅ Done | Optional field on materials |
| 3-Tier Stock Classification | ✅ Done | Stocked / Local Stock / Non-Stock |
| Admin password auth | ✅ Done | express-session + `requireAdmin` middleware |
| Public read-only catalog | ✅ Done | Anyone can browse without login |
| Dashboard stats + filters | ✅ Done | Manufacturer/supplier/group/cost level breakdowns |
| Browse-by navigation from Dashboard | ✅ Done | Buttons navigate to filtered Materials page |
| Material detail dialog | ✅ Done | Gold-accented design, color disclaimer |
| Object Storage image uploads | ✅ Done | Uppy + GCS via Replit sidecar |
| Server-side image caching | ✅ Done | 30min TTL, max 100 entries / 5MB each |
| Search bar (Dashboard hero) | ✅ Done | Routes to filtered Materials |
| Manufacturer filter persistence | ✅ Done | Carried as URL param into Materials page |
| Mobile responsive layout | ✅ Done | Sidebar collapses to sheet, hamburger Menu icon |
| Sidebar nav UX (mobile auto-close, desktop persist) | ✅ Done | `useSidebar().isMobile` gate |
| Brand theme (Gold / Charcoal / Brown / Off-white + Poppins) | ✅ Done | Matches netleymillwork.com |
| Dark mode | ✅ Done | Toggle in header, ThemeProvider class strategy |
| SEO basics (title, description) | 🔄 In Progress | Title set; OG/meta description not fully audited |
| Automated tests (e2e) | ❌ Not Started | No test suite present |
| CI/CD pipeline | ❌ Not Started | Manual deploy via Replit Publish |

---

## 5. Changelog (newest first)

### 2026-05-16 14:43 UTC — Fix: persistent PostgreSQL session store for admin auth
- **Files:** `server/index.ts`
- **What:** Replaced the default in-memory `MemoryStore` with a PostgreSQL-backed session store using `connect-pg-simple`. Session table (`session`) is auto-created via `createTableIfMissing: true`. Cookie lifetime extended to 7 days. `cookie.secure` now set dynamically: `true` in production (HTTPS), `false` in development.
- **Why:** Admin login was non-functional in production — every server restart wiped all in-memory sessions, so `isAdmin: true` was lost immediately. Production logs showed the `MemoryStore` warning firing dozens of times per day and every `/api/auth/status` returning `{"isAdmin":false}`. Sessions are now persisted in the database and survive restarts.

### 2026-05-02 13:20 UTC — Security patch: drizzle-orm
- **Files:** `package.json`, `package-lock.json`
- **What:** Bumped `drizzle-orm` 0.39.3 → **0.45.2**
- **Why:** GHSA-gpj5-g38j-94v9 — improper escaping of quoted SQL identifiers in `escapeName()` allowed potential SQL injection via untrusted identifier/alias input. Verified API endpoints (`/api/materials`, `/api/manufacturers`) still respond correctly after upgrade.

### 2026-05-02 13:03 UTC — Security patch: picomatch
- **Files:** `package.json`, `package-lock.json`
- **What:** Pinned `picomatch` to **^4.0.4** (was transitive 2.3.1)
- **Why:** GHSA-c2c7-rcm5-vvqj — ReDoS via crafted extglob patterns (`+(a|aa)`, nested extglobs).

### 2026-05-02 12:59 UTC — Security patch: minimatch
- **Files:** `package.json`, `package-lock.json`
- **What:** Pinned `minimatch` to **^10.2.5** (was transitive 9.0.5 via glob)
- **Why:** GHSA-23c5-xmqv-rm74 — ReDoS via nested extglob patterns.

### 2026-05-02 (earlier) — Security patch: fast-xml-parser
- **Files:** `package.json`, `package-lock.json`
- **What:** Pinned `fast-xml-parser` to **^5.7.2** (was transitive 5.3.4 via @google-cloud/storage)
- **Why:** GHSA-m7jm-9gc2-mpf2.

### 2026-05-02 (earlier) — Sidebar nav UX
- **Files:** `client/src/components/AppSidebar.tsx`, `client/src/App.tsx`
- **What:** Sidebar nav clicks auto-close only on mobile (via `useSidebar().isMobile` + `setOpenMobile`). Desktop sidebar stays open. Replaced default sidebar trigger icon with lucide `Menu` (3-line hamburger) on mobile.
- **Why:** Previously the desktop sidebar was collapsing on every nav click; mobile trigger lacked a clear hamburger affordance.

### 2026-05-02 (earlier) — Dashboard navigation refactor
- **Files:** `client/src/pages/Dashboard.tsx`
- **What:** Removed in-place `manufacturerFilter` state, `filteredMaterials`, `activeManufacturerName`. All Dashboard sections (Manufacturer / Supplier / Product Group / Cost Level) now navigate directly to `/materials?<filter>=X`. Manufacturer buttons restyled to match supplier buttons (flat + ArrowUpRight icon). Section renamed "Browse by Manufacturer".
- **Why:** Simpler mental model — Dashboard is browse/launch surface; Materials page owns filtering.

> Older history (logo uploads, image caching, brand theme, admin auth, sizes, storage system type, 3-tier stock terminology, color disclaimer) is summarized in `replit.md` under "Design Decisions".

---

## 6. Known Issues & Bugs

| Severity | Issue | Notes |
|---|---|---|
| Low | Browserslist data is 7 months old (build warning) | Cosmetic. Run `npx update-browserslist-db@latest` when convenient. |
| Low | PostCSS warning: "did not pass the `from` option to `postcss.parse`" | Upstream plugin warning, no functional impact. |
| Low | No automated test suite | Verification is manual / via curl + browser smoke tests. |
| ~~Critical~~ | ~~Admin login non-functional in production (MemoryStore sessions lost on restart)~~ | **Fixed 2026-05-16** — switched to PostgreSQL session store. |

No known security vulnerabilities outstanding as of this snapshot.

---

## 7. Next Steps (priority order)

1. **Continue security audit** — keep responding to vulnerability reports as they come in; bump pinned versions as needed.
2. **Verify drizzle-orm 0.45 compatibility end-to-end** — all CRUD paths through Materials/Suppliers/Manufacturers/Color Collections/Product Groups (read-only smoke tests pass; admin write paths to be exercised).
3. **SEO polish** — add per-page `<title>` and meta description, OpenGraph tags.
4. **Add a minimal e2e smoke test** — at least one Playwright happy-path covering admin login → create material → view on Dashboard.
5. **Refresh `caniuse-lite`** to silence the build warning.
6. **Consider a `drizzle-kit push` dry-run check** in a deploy hook to catch schema drift before publishing.
