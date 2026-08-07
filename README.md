# JKmart 99 — Monorepo Architecture

This project is organized into clean, independent directories for backend and frontend deployment:

```
jkmart-99/
├── frontend/        # Customer Web App (React + Vite, runs on port 3000)
├── admin-panel/     # Standalone Admin Portal (React + Vite, runs on port 3001)
└── backend/         # Supabase Database Schemas, RLS Policies, SQL Dumps & Environment Setup
```

## Folder Details

### 1. `frontend/` (Customer Storefront)
- Customer product catalog, cart checkout, order reference badges, email auth, and customer profile `/my-orders`.
- **Run locally**:
  ```powershell
  cd frontend
  npm install
  npm run dev
  ```

### 2. `admin-panel/` (Standalone Admin App)
- Independent portal for managing products (Add/Edit modals), viewing orders, toggling user admin roles, and updating store settings (with locked store name).
- **Run locally**:
  ```powershell
  cd admin-panel
  npm install
  npm run dev
  ```

### 3. `backend/` (Database & Supabase Configuration)
- Contains `schema.sql` (complete database schema, RLS security policies, triggers, and RPC functions for Supabase).
