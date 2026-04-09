ALTER TABLE public.recurring_templates
ADD COLUMN IF NOT EXISTS wallet_id uuid REFERENCES public.wallets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS recurring_templates_wallet_id_idx
ON public.recurring_templates(wallet_id);
