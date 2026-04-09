-- Security fix: prevent clients from forging partner invitation state
-- by directly mutating link-related columns.

CREATE OR REPLACE FUNCTION public.prevent_profile_link_field_tampering()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Allow normal updates that do not touch partner-link state.
    IF NEW.partner_id IS NOT DISTINCT FROM OLD.partner_id
       AND NEW.pending_partner_id IS NOT DISTINCT FROM OLD.pending_partner_id THEN
        RETURN NEW;
    END IF;

    -- Only trusted backend contexts (e.g. SECURITY DEFINER RPC owner role)
    -- may update these fields.
    IF current_user IN ('authenticated', 'anon') THEN
        RAISE EXCEPTION 'partner_id and pending_partner_id cannot be changed directly';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_link_field_tampering_trigger ON public.profiles;

CREATE TRIGGER prevent_profile_link_field_tampering_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_link_field_tampering();
