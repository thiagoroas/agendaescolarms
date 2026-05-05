-- Atualizar políticas da tabela profiles
DROP POLICY IF EXISTS "Leitura própria e mesma escola" ON public.profiles;
CREATE POLICY "Leitura própria e mesma escola" 
ON public.profiles 
FOR SELECT 
USING (
  id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.profile_escolas pe1
    JOIN public.profile_escolas pe2 ON pe1.escola_id = pe2.escola_id
    WHERE pe1.profile_id = auth.uid() 
    AND pe2.profile_id = public.profiles.id
    AND pe1.status = 'ativo'
    AND pe2.status = 'ativo'
  )
);

DROP POLICY IF EXISTS "profiles_same_school_select" ON public.profiles;
-- Removida pois a política acima já cobre isso de forma mais abrangente

DROP POLICY IF EXISTS "profiles_admin_lab_insert" ON public.profiles;
CREATE POLICY "profiles_admin_lab_insert" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profile_escolas 
    WHERE profile_id = auth.uid() 
    AND escola_id = public.profiles.escola_id 
    AND papel = 'admin_lab' 
    AND status = 'ativo'
  ) 
  AND papel = 'professor'
);

DROP POLICY IF EXISTS "profiles_admin_lab_update" ON public.profiles;
CREATE POLICY "profiles_admin_lab_update" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profile_escolas 
    WHERE profile_id = auth.uid() 
    AND escola_id = public.profiles.escola_id 
    AND papel = 'admin_lab' 
    AND status = 'ativo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profile_escolas 
    WHERE profile_id = auth.uid() 
    AND escola_id = public.profiles.escola_id 
    AND papel = 'admin_lab' 
    AND status = 'ativo'
  )
);

DROP POLICY IF EXISTS "profiles_admin_lab_delete" ON public.profiles;
CREATE POLICY "profiles_admin_lab_delete" 
ON public.profiles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profile_escolas 
    WHERE profile_id = auth.uid() 
    AND escola_id = public.profiles.escola_id 
    AND papel = 'admin_lab' 
    AND status = 'ativo'
  )
);
