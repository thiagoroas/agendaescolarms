-- 1. Atualizar is_admin_lab para verificar profile_escolas
CREATE OR REPLACE FUNCTION public.is_admin_lab()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND papel = 'admin_lab' AND status = 'ativo'
  ) OR EXISTS (
    SELECT 1 FROM public.profile_escolas 
    WHERE profile_id = auth.uid() AND papel = 'admin_lab' AND status = 'ativo'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Atualizar políticas da tabela escolas
DROP POLICY IF EXISTS "escolas_users_select_own" ON public.escolas;
CREATE POLICY "escolas_users_select_own" 
ON public.escolas 
FOR SELECT 
USING (
  id IN (
    SELECT escola_id FROM public.profile_escolas 
    WHERE profile_id = auth.uid() AND status = 'ativo'
  ) 
  OR id = (SELECT escola_id FROM public.profiles WHERE id = auth.uid())
);

-- 3. Atualizar políticas da tabela reservas para usar has_school_link
DROP POLICY IF EXISTS "reservas_school_select" ON public.reservas;
CREATE POLICY "reservas_school_select" 
ON public.reservas 
FOR SELECT 
USING (public.has_school_link(escola_id));

DROP POLICY IF EXISTS "reservas_admin_lab_all" ON public.reservas;
CREATE POLICY "reservas_admin_lab_all" 
ON public.reservas 
FOR ALL 
USING (public.has_school_link(escola_id, 'admin_lab'))
WITH CHECK (public.has_school_link(escola_id, 'admin_lab'));

DROP POLICY IF EXISTS "reservas_prof_insert" ON public.reservas;
CREATE POLICY "reservas_prof_insert" 
ON public.reservas 
FOR INSERT 
WITH CHECK (
  public.has_school_link(escola_id) 
  AND profile_id = auth.uid() 
  AND status = 'confirmada'
);

DROP POLICY IF EXISTS "reservas_prof_update" ON public.reservas;
CREATE POLICY "reservas_prof_update" 
ON public.reservas 
FOR UPDATE 
USING (profile_id = auth.uid())
WITH CHECK (
  profile_id = auth.uid() 
  AND public.has_school_link(escola_id)
);

-- 4. Atualizar políticas da tabela recursos
DROP POLICY IF EXISTS "recursos_select_all" ON public.recursos;
CREATE POLICY "recursos_select_all" 
ON public.recursos 
FOR SELECT 
USING (public.has_school_link(escola_id));

DROP POLICY IF EXISTS "recursos_admin_lab_all" ON public.recursos;
CREATE POLICY "recursos_admin_lab_all" 
ON public.recursos 
FOR ALL 
USING (public.has_school_link(escola_id, 'admin_lab'))
WITH CHECK (public.has_school_link(escola_id, 'admin_lab'));

-- 5. Atualizar políticas da tabela avisos_laboratorio
DROP POLICY IF EXISTS "avisos_select_policy" ON public.avisos_laboratorio;
CREATE POLICY "avisos_select_policy" 
ON public.avisos_laboratorio 
FOR SELECT 
USING (public.has_school_link(escola_id));

DROP POLICY IF EXISTS "avisos_admin_lab_all" ON public.avisos_laboratorio;
CREATE POLICY "avisos_admin_lab_all" 
ON public.avisos_laboratorio 
FOR ALL 
USING (public.has_school_link(escola_id, 'admin_lab'))
WITH CHECK (public.has_school_link(escola_id, 'admin_lab'));

-- 6. Atualizar políticas da tabela horarios_escola
DROP POLICY IF EXISTS "horarios_select_policy" ON public.horarios_escola;
CREATE POLICY "horarios_select_policy" 
ON public.horarios_escola 
FOR SELECT 
USING (public.has_school_link(escola_id));

DROP POLICY IF EXISTS "horarios_admin_lab_all" ON public.horarios_escola;
CREATE POLICY "horarios_admin_lab_all" 
ON public.horarios_escola 
FOR ALL 
USING (public.has_school_link(escola_id, 'admin_lab'))
WITH CHECK (public.has_school_link(escola_id, 'admin_lab'));
