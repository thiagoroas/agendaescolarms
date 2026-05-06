CREATE OR REPLACE FUNCTION public.has_school_link(
  p_escola_id uuid,
  p_papel text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_escolas pe
    WHERE pe.profile_id = auth.uid()
      AND pe.escola_id = p_escola_id
      AND pe.status = 'ativo'
      AND (
        p_papel IS NULL
        OR pe.papel = p_papel
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_school_link(uuid, text) TO authenticated;