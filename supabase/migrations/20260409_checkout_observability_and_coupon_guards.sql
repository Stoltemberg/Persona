ALTER TABLE public.checkout_intents
ADD COLUMN IF NOT EXISTS app_url text,
ADD COLUMN IF NOT EXISTS coupon_validation_tier text CHECK (coupon_validation_tier IN ('intermediate', 'complete')),
ADD COLUMN IF NOT EXISTS plan_title text,
ADD COLUMN IF NOT EXISTS checkout_validated boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mp_init_point text,
ADD COLUMN IF NOT EXISTS mp_sandbox_init_point text,
ADD COLUMN IF NOT EXISTS mp_preference_payload jsonb,
ADD COLUMN IF NOT EXISTS mp_payment_payload jsonb,
ADD COLUMN IF NOT EXISTS verified_amount numeric(10,2),
ADD COLUMN IF NOT EXISTS verified_currency text;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE code = coupon_code
      AND active = true
      AND (max_uses IS NULL OR used_count < max_uses);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Limite de uso do cupom atingido ou cupom inativo.';
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_coupon(coupon_code text, selected_tier text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    coupon_record record;
    tier_is_compatible boolean;
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

    tier_is_compatible := selected_tier IS NULL
        OR coupon_record.target_tier IS NULL
        OR coupon_record.target_tier = selected_tier;

    RETURN json_build_object(
        'success', true,
        'code', coupon_record.code,
        'tier', coupon_record.target_tier,
        'discount', coupon_record.discount_percent,
        'discount_percent', coupon_record.discount_percent,
        'trial_days', coupon_record.trial_days,
        'selected_tier', selected_tier,
        'valid_for_selected_tier', tier_is_compatible
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_coupon(coupon_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN public.redeem_coupon(coupon_code, NULL);
END;
$$;
