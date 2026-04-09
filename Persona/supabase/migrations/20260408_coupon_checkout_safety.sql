CREATE TABLE IF NOT EXISTS public.processed_payments (
    payment_id text PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier text CHECK (tier IN ('free', 'intermediate', 'complete')),
    coupon_code text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read processed payments" ON public.processed_payments
    FOR SELECT
    USING (
        auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
    );

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE code = coupon_code
      AND active = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_coupon(coupon_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    coupon_record record;
BEGIN
    SELECT *
    INTO coupon_record
    FROM public.coupons
    WHERE code = coupon_code
      AND active = true;

    IF coupon_record.id IS NULL THEN
        RAISE EXCEPTION 'Cupom invalido ou expirado.';
    END IF;

    IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < now() THEN
        RAISE EXCEPTION 'Cupom expirado.';
    END IF;

    IF coupon_record.max_uses IS NOT NULL AND coupon_record.used_count >= coupon_record.max_uses THEN
        RAISE EXCEPTION 'Limite de uso do cupom atingido.';
    END IF;

    RETURN json_build_object(
        'success', true,
        'tier', coupon_record.target_tier,
        'discount', coupon_record.discount_percent,
        'trial_days', coupon_record.trial_days
    );
END;
$$;
