CREATE TABLE IF NOT EXISTS public.checkout_intents (
    external_reference text PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tier text NOT NULL CHECK (tier IN ('intermediate', 'complete')),
    coupon_code text,
    expected_amount numeric(10,2) NOT NULL,
    currency_id text NOT NULL DEFAULT 'BRL',
    mp_preference_id text,
    mp_payment_id text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_intents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'checkout_intents'
          AND policyname = 'Admins can read checkout intents'
    ) THEN
        CREATE POLICY "Admins can read checkout intents" ON public.checkout_intents
            FOR SELECT
            USING (
                auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
            );
    END IF;
END $$;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'subscriptions'
          AND policyname = 'Users can read own subscriptions'
    ) THEN
        CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'subscriptions'
          AND policyname = 'Admins can read subscriptions'
    ) THEN
        CREATE POLICY "Admins can read subscriptions" ON public.subscriptions
            FOR SELECT
            USING (
                auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
            );
    END IF;
END $$;
