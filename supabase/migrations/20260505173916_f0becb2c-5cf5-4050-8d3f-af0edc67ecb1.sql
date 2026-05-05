-- 1. Criar ou atualizar função para verificar vínculos de escola com SECURITY DEFINER
-- Isso evita a recursão infinita (42P17) pois a função roda com privilégios de owner e ignora a RLS da tabela consultada internamente.
CREATE OR REPLACE FUNCTION public.has_school_link(p_escola_id uuid, p_papel text DEFAULT NULL)
RETURNS boolean 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profile_escolas 
    WHERE profile_id = auth.uid() 
    AND escola_id = p_escola_id 
    AND (p_papel IS NULL OR papel = p_papel)
    AND status = 'ativo'
  );
$$;

-- 2. Limpar políticas antigas problemáticas
DROP POLICY IF EXISTS "Acesso restrito por vínculo" ON public.profile_escolas;
DROP POLICY IF EXISTS "Gerenciamento total para Admin Plataforma" ON public.profile_escolas;
DROP POLICY IF EXISTS "Gerenciamento restrito para Admin Lab" ON public.profile_escolas;
DROP POLICY IF EXISTS "Visualização de vínculos" ON public.profile_escolas;
DROP POLICY IF EXISTS "Gerenciamento restrito de vínculos" ON public.profile_escolas;

-- 3. Criar novas políticas seguras para profile_escolas

-- SELECT: Admin Plat vê tudo, Usuário vê a si mesmo, Admin Lab vê sua escola
CREATE POLICY "profile_escolas_select_policy"
ON public.profile_escolas
FOR SELECT
TO authenticated
USING (
  public.is_admin_plataforma()
  OR profile_id = auth.uid()
  OR public.has_school_link(escola_id, 'admin_lab')
);

-- INSERT: Admin Plat cria qualquer vínculo, Admin Lab cria apenas em sua escola
CREATE POLICY "profile_escolas_insert_policy"
ON public.profile_escolas
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_plataforma()
  OR (public.has_school_link(escola_id, 'admin_lab') AND papel = 'professor')
);

-- UPDATE: Admin Plat gerencia tudo, Admin Lab gerencia sua escola
CREATE POLICY "profile_escolas_update_policy"
ON public.profile_escolas
FOR UPDATE
TO authenticated
USING (
  public.is_admin_plataforma()
  OR public.has_school_link(escola_id, 'admin_lab')
)
WITH CHECK (
  public.is_admin_plataforma()
  OR (public.has_school_link(escola_id, 'admin_lab') AND papel = 'professor')
);

-- DELETE: Apenas Admin Plataforma pode remover vínculos permanentemente
-- (Administradores de Lab devem usar status='removido' via UPDATE)
CREATE POLICY "profile_escolas_delete_policy"
ON public.profile_escolas
FOR DELETE
TO authenticated
USING (
  public.is_admin_plataforma()
);
