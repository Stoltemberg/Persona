-- FIX ADMIN & PERMISSIONS

-- 1. Create robust Admin Check Function (Security Definer to bypass recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Enable RLS on profiles (just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts complexity
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- 4. Create Standard Policies

-- A. Users can view their own profile (Critical for Login/Sidebar)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING ( auth.uid() = id );

-- B. Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING ( auth.uid() = id );

-- C. Admins can view ALL profiles (Critical for User List)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING ( is_admin() );

-- D. Admins can update ALL profiles (Optional, for future editing)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING ( is_admin() );
