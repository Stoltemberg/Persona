DROP FUNCTION IF EXISTS public.redeem_coupon(text, text);
DROP FUNCTION IF EXISTS public.redeem_coupon(text);
DROP FUNCTION IF EXISTS public.increment_coupon_usage(text);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP TABLE IF EXISTS public.coupons;

ALTER TABLE public.checkout_intents
DROP COLUMN IF EXISTS coupon_code,
DROP COLUMN IF EXISTS coupon_validation_tier;

ALTER TABLE public.processed_payments
DROP COLUMN IF EXISTS coupon_code;
