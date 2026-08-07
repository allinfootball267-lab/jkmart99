# JKmart 99 — Backend (Supabase Setup)

This folder contains the database schema, security policies, triggers, and functions required by the Supabase backend.

## Structure

- `schema.sql` — Complete SQL dump containing:
  - Tables: `products`, `orders`, `order_items`, `settings`
  - Row Level Security (RLS) policies for shopper and admin access
  - Views: `profiles`
  - RPC Functions: `decrement_stock`, `toggle_user_admin`, `auto_confirm_user`
- `.env.example` — Template environment variables for Supabase credentials

## Deployment Instructions

1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor**.
3. Copy and run the contents of `schema.sql`.
