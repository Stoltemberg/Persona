-- 1. Add Columns to Profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname text,
ADD COLUMN IF NOT EXISTS discriminator text,
ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Ensure unique constraint for nickname + discriminator (ignoring nulls temporarily if existing records)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_nickname_discriminator_idx ON public.profiles(nickname, discriminator) WHERE nickname IS NOT NULL AND discriminator IS NOT NULL;

-- 2. Create RPC for linking partners
CREATE OR REPLACE FUNCTION public.link_partner(partner_tag text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_partner_id uuid;
    v_nickname text;
    v_discriminator text;
    v_parts text[];
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Parse nickname#discriminator
    v_parts := string_to_array(partner_tag, '#');
    IF array_length(v_parts, 1) != 2 THEN
        RAISE EXCEPTION 'Formato inválido. Use nickname#1234';
    END IF;
    
    v_nickname := v_parts[1];
    v_discriminator := v_parts[2];

    -- Find partner
    SELECT id INTO v_partner_id
    FROM public.profiles
    WHERE nickname = v_nickname AND discriminator = v_discriminator;

    IF v_partner_id IS NULL THEN
        RAISE EXCEPTION 'Parceiro não encontrado.';
    END IF;

    IF v_partner_id = v_user_id THEN
        RAISE EXCEPTION 'Você não pode vincular sua própria conta.';
    END IF;

    -- Update both profiles to be linked to each other
    UPDATE public.profiles SET partner_id = v_partner_id WHERE id = v_user_id;
    UPDATE public.profiles SET partner_id = v_user_id WHERE id = v_partner_id;

    RETURN json_build_object('success', true, 'message', 'Contas vinculadas com sucesso.');
END;
$$;

-- 3. Create RPC for unlinking partners
CREATE OR REPLACE FUNCTION public.unlink_partner()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_partner_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Get current partner
    SELECT partner_id INTO v_partner_id FROM public.profiles WHERE id = v_user_id;

    IF v_partner_id IS NOT NULL THEN
        -- Unlink both
        UPDATE public.profiles SET partner_id = NULL WHERE id = v_user_id;
        UPDATE public.profiles SET partner_id = NULL WHERE id = v_partner_id;
    END IF;

    RETURN json_build_object('success', true, 'message', 'Vínculo removido com sucesso.');
END;
$$;

-- 4. Helper Function to get Family IDs (User + Partner)
-- This is useful for RLS to check if a record belongs to the user or their partner
CREATE OR REPLACE FUNCTION public.get_family_ids()
RETURNS TABLE (id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT id FROM public.profiles WHERE id = auth.uid()
    UNION
    SELECT partner_id FROM public.profiles WHERE id = auth.uid() AND partner_id IS NOT NULL;
$$;

-- 5. Update RLS Policies for sharing data
-- Assuming tables: transactions, wallets, goals, budgets, categories, recurring_templates
-- Modify as needed based on existing policies. 
-- Here we drop the current single-user policies and add family policies if they exist.

DO $$ 
DECLARE
    table_name text;
    tables CURSOR FOR 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('transactions', 'wallets', 'goals', 'budgets', 'categories', 'recurring_templates');
BEGIN
    FOR t IN tables LOOP
        -- For simplicity in this migration, we will create new policies with recognizable names
        -- You may need to drop existing restrictive policies manually via Dashboard if they conflict
        
        EXECUTE format('
            DROP POLICY IF EXISTS "Enable read access for family" ON public.%I;
            DROP POLICY IF EXISTS "Enable insert access for family" ON public.%I;
            DROP POLICY IF EXISTS "Enable update access for family" ON public.%I;
            DROP POLICY IF EXISTS "Enable delete access for family" ON public.%I;
            
            -- Family Select Policy
            CREATE POLICY "Enable read access for family" ON public.%I
            AS PERMISSIVE FOR SELECT
            USING (profile_id IN (SELECT id FROM public.get_family_ids()));
            
            -- Family Insert Policy
            CREATE POLICY "Enable insert access for family" ON public.%I
            AS PERMISSIVE FOR INSERT
            WITH CHECK (profile_id IN (SELECT id FROM public.get_family_ids()));

            -- Family Update Policy
            CREATE POLICY "Enable update access for family" ON public.%I
            AS PERMISSIVE FOR UPDATE
            USING (profile_id IN (SELECT id FROM public.get_family_ids()))
            WITH CHECK (profile_id IN (SELECT id FROM public.get_family_ids()));

            -- Family Delete Policy
            CREATE POLICY "Enable delete access for family" ON public.%I
            AS PERMISSIVE FOR DELETE
            USING (profile_id IN (SELECT id FROM public.get_family_ids()));
        ', t.tablename, t.tablename, t.tablename, t.tablename, t.tablename, t.tablename, t.tablename, t.tablename);
    END LOOP;
END $$;

-- 6. Enable Realtime Sync for shared tables (Modo Casal Sincronizado)
-- Note: Se alguma tabela já estiver no realtime, esta linha pode dar skip ou erro leve, você pode ignorar.
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
  ALTER PUBLICATION supabase_realtime ADD TABLE transactions, wallets, goals, budgets;
COMMIT;
