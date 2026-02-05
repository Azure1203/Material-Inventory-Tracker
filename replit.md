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
- **Color Ranges**: Product lines from manufacturers (e.g., Karisma, Rivera)
- **Product Groups**: Categories for materials (e.g., Interior Colors, Sublime Collection)
- **Materials**: Individual products with references to supplier, manufacturer, color range, and product group
- **Material Thicknesses**: Available thicknesses for each material with stock status

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

### Stock Classification Terminology
- **Stock Item** (`inStock: true`): A regularly stocked material that is always available
- **Non-Stock** (`inStock: false`): A special order material that must be ordered when needed
- This is a permanent classification, not a temporary inventory status

### Technical Notes
- SelectItem components cannot use empty string values due to Radix Select requirements. Use "all" or similar non-empty placeholder values for "All items" options.
- Object storage routes use regex pattern `/^\/objects\/(.+)$/` for Express 5 compatibility with nested paths