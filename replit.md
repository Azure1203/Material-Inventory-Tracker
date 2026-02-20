# Replit.md

## Overview

This is a materials inventory management system for tracking building materials (melamine, TFL panels, etc.) from various suppliers and manufacturers. The application allows users to manage a catalog of materials with properties like color ranges, product groups, thicknesses, stock status, and cost levels. It features a dashboard with statistics, CRUD operations for all entities, and image upload capabilities for material photos.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Forms**: React Hook Form with Zod for validation

The frontend follows a page-based architecture with reusable components. Each entity (Materials, Suppliers, Manufacturers, Color Ranges, Product Groups) has its own page with table views, dialog forms for create/edit operations, and delete confirmations.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful JSON API with endpoints under `/api/`
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Validation**: Zod schemas generated from Drizzle schemas using drizzle-zod

The backend uses a storage pattern (`server/storage.ts`) that abstracts database operations, making it easier to swap implementations or add caching layers.

### Data Model
The schema defines a hierarchical structure:
- **Suppliers**: Companies that sell materials (e.g., Whitewood)
- **Manufacturers**: Companies that make materials (e.g., Tafisa, Uniboard)
- **Color Collections**: Product lines from manufacturers (e.g., Karisma, Rivera)
- **Product Groups**: Categories for materials (e.g., Interior Colors, Sublime Collection)
- **Materials**: Individual products with references to supplier, manufacturer, color collection, and product groups (many-to-many via `materialProductGroups` junction table). Each material has an optional `storageSystemType` field for tracking Storage System Type #.
- **Material Sizes**: Available size options (width × length @ thickness) for each material - combines dimensions and thickness into single entries since availability varies by combination (e.g., 4ft x 8ft @ 5/8")

### Build System
- Development uses Vite dev server with HMR
- Production builds use esbuild for the server (bundling specific dependencies for faster cold starts) and Vite for the client
- Server output goes to `dist/index.cjs`, client output to `dist/public`

## External Dependencies

### Database
- PostgreSQL database accessed via `DATABASE_URL` environment variable
- Drizzle Kit for schema migrations (`drizzle-kit push`)

### Object Storage
- Google Cloud Storage integration for file uploads (material images)
- Uses Replit's sidecar service for authentication (`http://127.0.0.1:1106`)
- Presigned URL pattern for direct uploads from the client
- Uppy library for file upload UI and management

### Third-Party Libraries
- **@google-cloud/storage**: Cloud storage client for image uploads
- **@tanstack/react-query**: Server state management
- **@uppy/core, @uppy/dashboard, @uppy/aws-s3**: File upload handling
- **drizzle-orm, drizzle-zod**: Database ORM and schema validation
- **zod**: Runtime type validation shared between client and server

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Development tooling
- `@replit/vite-plugin-dev-banner`: Development environment indicator
- Object storage routes (`server/replit_integrations/object_storage/`) handle Replit's cloud storage service

## Design Decisions

### Stock Classification Terminology (3-Tier System)
- **Stocked At Netley Millwork** (`stockStatus: "stocked"`): A regularly stocked material always available
- **Local Stock, 2-3 Week Leadtime** (`stockStatus: "local_stock"`): Available locally but requires lead time
- **Non-Stock, 6-12 Week Leadtime** (`stockStatus: "non_stock"`): Special order material with longer lead time
- This is a permanent classification, not a temporary inventory status
- **No "out of stock" concept**: This is a material catalog, not inventory tracking
- Constants defined in `shared/schema.ts` via `STOCK_STATUS` and `STOCK_STATUS_LABELS`

### Color Disclaimer
- Small info icon appears on all material images (list view, detail dialog, edit form)
- Opens a popover with "Color Notice" explaining that photos may not match actual colors
- Recommends customers contact Netley Millwork Sales Rep for physical samples

### Size Options
- Materials can have multiple size options combining width, length, and thickness (e.g., "4ft x 8ft @ 5/8"", "5x10 @ 3/4"")
- Size options are stored in `materialSizes` table with `width`, `length`, and `thickness` fields
- Availability varies by combination - certain sizes may only be available in specific thicknesses
- Display format: "width x length @ thickness"

### Admin Authentication
- Password-based admin access controls editing (add/edit/delete) across all entity pages
- The catalog is publicly viewable by everyone; only admin users can make changes
- Backend: express-session stores `isAdmin` flag; all POST/PATCH/DELETE routes use `requireAdmin` middleware
- Frontend: `AdminAuthProvider` context provides `isAdmin` state; admin login/logout toggle in the header
- Admin password stored as `ADMIN_PASSWORD` secret environment variable
- Auth endpoints: POST `/api/auth/login`, POST `/api/auth/logout`, GET `/api/auth/status`

### Dashboard
- Dashboard features a manufacturer filter (button row) that filters all stats, product group breakdowns, and cost level breakdowns
- Clicking through to Materials from a filtered dashboard preserves the manufacturer filter as a URL parameter

### Logo Uploads
- Manufacturers and Suppliers both support logo image uploads via the same presigned URL flow used for material images
- Logos are stored in object storage and referenced via `logoUrl` field on each entity
- Dashboard filter buttons display logos inline (4x4 on mobile, same on desktop) next to entity names
- Manufacturers/Suppliers list pages show logos in table rows (8x8 desktop, 7x7 mobile cards)

### Image Performance
- Server-side in-memory cache (30min TTL, max 100 entries, max 5MB per entry) for object storage images
- Eliminates repeated GCS API round-trips (metadata fetch + ACL check + stream) for cached images
- Browser Cache-Control set to `public, max-age=86400` (24 hours)
- Frontend uses `loading="lazy"` + `decoding="async"` on img tags with skeleton placeholders

### Technical Notes
- SelectItem components cannot use empty string values due to Radix Select requirements. Use "all" or similar non-empty placeholder values for "All items" options.
- Object storage routes use regex pattern `/^\/objects\/(.+)$/` for Express 5 compatibility with nested paths