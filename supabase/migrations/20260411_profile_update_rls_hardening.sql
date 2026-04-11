-- Harden self-service profile updates so authorization attributes cannot be
-- escalated through the public Supabase API.

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (
    SELECT current_profile.role
    FROM public.profiles AS current_profile
    WHERE current_profile.id = auth.uid()
  )
  AND plan_tier = (
    SELECT current_profile.plan_tier
    FROM public.profiles AS current_profile
    WHERE current_profile.id = auth.uid()
  )
);
