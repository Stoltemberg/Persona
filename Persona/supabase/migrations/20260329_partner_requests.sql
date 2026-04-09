-- Migration: Fluxo Assíncrono de Convite para Parceiro (Modo Casal)

-- 1. Adicionar o campo que salva de quem veio o convite (se houver)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pending_partner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Atualizar a RPC de Enviar Convite
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
        RAISE EXCEPTION 'Você não pode convidar a si mesmo.';
    END IF;

    -- Validar se já existe um vínculo definitivo em alguma das contas
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND partner_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Você já possui uma conta vinculada. Desvincule antes de enviar um novo convite.';
    END IF;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_partner_id AND partner_id IS NOT NULL) THEN
        RAISE EXCEPTION 'A conta que você tentou convidar já possui um parceiro.';
    END IF;

    -- Update target profile setting the inviting user's id as pending
    UPDATE public.profiles SET pending_partner_id = v_user_id WHERE id = v_partner_id;

    RETURN json_build_object('success', true, 'message', 'Convite enviado aguardando aprovação!');
END;
$$;

-- 3. Criar RPC para o Convidado ACEITAR
CREATE OR REPLACE FUNCTION public.accept_partner_request()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_inviter_id uuid;
BEGIN
    v_user_id := auth.uid();
    
    -- Checa quem nos convidou
    SELECT pending_partner_id INTO v_inviter_id FROM public.profiles WHERE id = v_user_id;

    IF v_inviter_id IS NULL THEN
         RAISE EXCEPTION 'Você não possui nenhum convite pendente.';
    END IF;

    -- Vincula ambos e limpa a pendência
    UPDATE public.profiles SET partner_id = v_inviter_id, pending_partner_id = NULL WHERE id = v_user_id;
    UPDATE public.profiles SET partner_id = v_user_id WHERE id = v_inviter_id;

    RETURN json_build_object('success', true, 'message', 'Convite aceito com sucesso! Bem-vindo ao Modo Casal.');
END;
$$;

-- 4. Criar RPC para o Convidado REJEITAR
CREATE OR REPLACE FUNCTION public.reject_partner_request()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    -- Apenas zera a pendencia
    UPDATE public.profiles SET pending_partner_id = NULL WHERE id = v_user_id;
    RETURN json_build_object('success', true, 'message', 'Convite recusado.');
END;
$$;

-- 5. Criar RPC para o Remetente CANCELAR SEU CONVITE
CREATE OR REPLACE FUNCTION public.cancel_partner_request()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    -- Zera a pendencia na conta alvo de quem eu convidei
    UPDATE public.profiles SET pending_partner_id = NULL WHERE pending_partner_id = v_user_id;
    RETURN json_build_object('success', true, 'message', 'Convite cancelado.');
END;
$$;
