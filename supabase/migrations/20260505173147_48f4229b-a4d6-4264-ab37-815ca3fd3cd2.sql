-- 1. Corrigir funções de segurança para evitar recursão infinita e problemas de permissão
-- Usar SECURITY DEFINER permite que a função acesse as tabelas com privilégios do criador (bypass RLS se necessário ou via owner)
-- O search_path fixo é uma recomendação de segurança para SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.is_admin_plataforma()
RETURNS boolean 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND papel = 'admin_plataforma' 
    AND status = 'ativo'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_lab()
RETURNS boolean 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND papel = 'admin_lab' 
    AND status = 'ativo'
  );
$$;

CREATE OR REPLACE FUNCTION public.my_escola_id()
RETURNS uuid 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT escola_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Atualizar políticas de profiles
-- Remover políticas conflitantes ou redundantes
DROP POLICY IF EXISTS "profiles_admin_plat_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_lab_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_select" ON public.profiles;

CREATE POLICY "Acesso total Admin Plataforma" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (is_admin_plataforma());

CREATE POLICY "Leitura própria e mesma escola" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  id = auth.uid() OR 
  (escola_id IS NOT NULL AND escola_id = my_escola_id())
);

-- 3. Atualizar políticas de profile_escolas
DROP POLICY IF EXISTS "Acesso restrito por vínculo" ON public.profile_escolas;

CREATE POLICY "Visualização de vínculos" 
ON public.profile_escolas 
FOR SELECT 
TO authenticated
USING (
    is_admin_plataforma() OR 
    profile_id = auth.uid() OR 
    (EXISTS ( 
        SELECT 1 FROM public.profile_escolas pe_admin
        WHERE pe_admin.profile_id = auth.uid() 
        AND pe_admin.escola_id = public.profile_escolas.escola_id 
        AND pe_admin.papel = 'admin_lab'
    ))
);
