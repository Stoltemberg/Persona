-- URGENTE FIX: Removendo a recursividade infinita que derrubou as consultas
-- Ao usarmos SELECT public.profiles DENTRO de uma política na própria tabela public.profiles,
-- o PostgreSQL entra em loop ("infinite recursion") bloqueando tudo.

-- 1. Remover a política defeituosa
DROP POLICY IF EXISTS "Enable read access for family and invites" ON public.profiles;

-- 2. Criar uma função SECURITY DEFINER. Isso permite ler perfis ignorando outras regras de RLS
-- (impossibilitando o loop)
CREATE OR REPLACE FUNCTION public.get_allowed_profile_ids()
RETURNS setof uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    -- O meu próprio perfil
    SELECT auth.uid()
    UNION
    -- Aquele que já é meu parceiro(a)
    SELECT partner_id FROM public.profiles WHERE id = auth.uid() AND partner_id IS NOT NULL
    UNION
    -- Aquele que ME convidou
    SELECT pending_partner_id FROM public.profiles WHERE id = auth.uid() AND pending_partner_id IS NOT NULL
    UNION
    -- Aquele que EU convidei
    SELECT id FROM public.profiles WHERE pending_partner_id = auth.uid();
$$;

-- 3. Recriar a política APENAS validando a lista super-rápida de IDs retornada pela função
CREATE POLICY "Enable read access for family and invites"
ON public.profiles
FOR SELECT
USING (
    id IN (SELECT public.get_allowed_profile_ids())
);
