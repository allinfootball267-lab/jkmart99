-- ============================================================
-- JKmart 99 — Database Schema & RLS Policies
-- Backend Database Configuration for Supabase
-- ============================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  specifications text,
  price numeric NOT NULL,
  discount_price numeric,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  category text DEFAULT 'General',
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Migration helper for existing databases:
-- ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text DEFAULT 'General';

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  pin_code text NOT NULL,
  total_amount numeric NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'Pending'::text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  price numeric NOT NULL
);

-- 4. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  id integer PRIMARY KEY DEFAULT 1,
  store_name text NOT NULL DEFAULT 'JKmart 99'::text,
  phone text DEFAULT ''::text,
  address text DEFAULT ''::text,
  whatsapp_number text DEFAULT ''::text,
  upi_id text DEFAULT ''::text,
  delivery_charges numeric NOT NULL DEFAULT 50
);

-- Insert default settings row if empty
INSERT INTO public.settings (id, store_name, delivery_charges)
VALUES (1, 'JKmart 99', 50)
ON CONFLICT (id) DO NOTHING;

-- 5. PROFILES VIEW (Safe metadata projection)
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
  id,
  email,
  created_at,
  COALESCE(raw_user_meta_data->>'name', '') AS name,
  COALESCE(raw_app_meta_data->>'role', 'shopper') AS role
FROM auth.users;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_admin_insert" ON public.products FOR INSERT TO authenticated WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "products_admin_update" ON public.products FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "products_admin_delete" ON public.products FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Orders Policies
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT TO authenticated, anon USING (((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') OR (auth.uid() = user_id) OR (user_id IS NULL));
CREATE POLICY "orders_admin_update" ON public.orders FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "orders_admin_delete" ON public.orders FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Order Items Policies
CREATE POLICY "order_items_public_insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_select_policy" ON public.order_items FOR SELECT TO authenticated, anon USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id));
CREATE POLICY "order_items_admin_update" ON public.order_items FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "order_items_admin_delete" ON public.order_items FOR DELETE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Settings Policies
CREATE POLICY "settings_public_read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_update" ON public.settings FOR UPDATE TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- View Grants
GRANT SELECT ON public.profiles TO authenticated;

-- ============================================================
-- FUNCTIONS & PROCEDURES
-- ============================================================

-- Atomic Stock Decrement Function
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id uuid, p_quantity integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock integer;
BEGIN
  SELECT stock INTO current_stock FROM public.products WHERE id = p_product_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Product not found'; END IF;
  IF current_stock < p_quantity THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
  UPDATE public.products SET stock = stock - p_quantity WHERE id = p_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_stock(uuid, integer) TO anon, authenticated;

-- Role Promotion Function
CREATE OR REPLACE FUNCTION public.toggle_user_admin(p_target_user_id uuid, p_make_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
    RAISE EXCEPTION 'Access Denied';
  END IF;

  IF p_make_admin THEN
    UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb WHERE id = p_target_user_id;
  ELSE
    UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data - 'role' WHERE id = p_target_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_user_admin(uuid, boolean) TO authenticated;

-- Auto Confirm Signups Trigger
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_user();
