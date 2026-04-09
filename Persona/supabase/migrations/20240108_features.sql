-- Add role to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Add tier to subscriptions (if not exists in logic, or usually we use metadata, but let's add a column for explicit tier)
-- But wait, subscriptions might be managed by Stripe/MercadoPago webhooks. 
-- However, for our internal logic, let's add a tier column to profiles or subscriptions.
-- Let's add it to profiles for simplicity as 'plan_tier'
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_tier text DEFAULT 'free' CHECK (plan_tier IN ('free', 'intermediate', 'complete'));

-- Create Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    discount_percent integer DEFAULT 0,
    trial_days integer DEFAULT 0,
    target_tier text CHECK (target_tier IN ('free', 'intermediate', 'complete')),
    max_uses integer DEFAULT 1,
    used_count integer DEFAULT 0,
    expires_at timestamptz,
    created_at timestamptz DEFAULT now(),
    active boolean DEFAULT true
);

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do everything
CREATE POLICY "Admins can manage coupons" ON public.coupons
    FOR ALL
    USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

-- Policy: Users can only read active coupons (actually, they shouldn't read the list, just check a specific code)
-- So we might keep it restricted and use an RPC function to redeem.

-- Function to Redeem Coupon
CREATE OR REPLACE FUNCTION redeem_coupon(coupon_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    coupon_record record;
    user_id uuid;
BEGIN
    user_id := auth.uid();
    
    -- Find coupon
    SELECT * INTO coupon_record FROM public.coupons 
    WHERE code = coupon_code AND active = true;

    IF coupon_record.id IS NULL THEN
        RAISE EXCEPTION 'Cupom inválido ou expirado.';
    END IF;

    -- Check expiration
    IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < now() THEN
        RAISE EXCEPTION 'Cupom expirado.';
    END IF;

    -- Check usage limits
    IF coupon_record.max_uses IS NOT NULL AND coupon_record.used_count >= coupon_record.max_uses THEN
         RAISE EXCEPTION 'Limite de uso do cupom atingido.';
    END IF;

    -- Apply changes (Example: Upgrade to tier)
    -- This is a simplified logic. In a real app we might update specific subscription tables.
    -- Here we update the profile's plan_tier directly for the "Grátis" logic or discount handling.
    
    IF coupon_record.target_tier IS NOT NULL THEN
        UPDATE public.profiles 
        SET plan_tier = coupon_record.target_tier 
        WHERE id = user_id;
    END IF;

    -- Increment usage
    UPDATE public.coupons 
    SET used_count = used_count + 1 
    WHERE id = coupon_record.id;

    RETURN json_build_object(
        'success', true, 
        'tier', coupon_record.target_tier, 
        'discount', coupon_record.discount_percent
    );
END;
$$;
