-- Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS permissions text[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at text DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS district text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS street text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS building text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gps_lat real;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gps_lng real;
