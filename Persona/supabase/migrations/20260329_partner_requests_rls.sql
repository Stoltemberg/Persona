-- Correção de RLS para Modo Casal: Permitir que usuários comuns leiam o perfil 
-- de quem lhes enviou o convite, ou de quem eles estão vinculados.

DROP POLICY IF EXISTS "Enable read access for family and invites" ON public.profiles;

CREATE POLICY "Enable read access for family and invites"
ON public.profiles
FOR SELECT
USING (
    -- A. Usuário é dono do próprio perfil
    id = auth.uid() OR
    -- B. Perfis já estão vinculados mutuamente
    partner_id = auth.uid() OR
    -- C. Sou dono do convite de quem estou lendo
    id = (SELECT partner_id FROM public.profiles WHERE id = auth.uid()) OR
    -- D. O perfil me enviou um convite pendente
    id = (SELECT pending_partner_id FROM public.profiles WHERE id = auth.uid()) OR
    -- E. Eu enviei um convite pendente para este perfil
    pending_partner_id = auth.uid()
);
