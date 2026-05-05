-- Corrigir política de SELECT na profile_escolas
DROP POLICY IF EXISTS "Acesso restrito por vínculo" ON public.profile_escolas;

CREATE POLICY "Acesso restrito por vínculo" 
ON public.profile_escolas 
FOR SELECT 
USING (
    (auth.uid() = profile_id) OR 
    is_admin_plataforma() OR 
    (EXISTS ( 
        SELECT 1 FROM public.profile_escolas pe_admin
        WHERE pe_admin.profile_id = auth.uid() 
        AND pe_admin.escola_id = public.profile_escolas.escola_id 
        AND pe_admin.papel = 'admin_lab'
    ))
);

-- Garantir gerenciamento total para Admin Plataforma
DROP POLICY IF EXISTS "Gerenciamento restrito de vínculos" ON public.profile_escolas;

CREATE POLICY "Gerenciamento total para Admin Plataforma" 
ON public.profile_escolas 
FOR ALL 
USING (is_admin_plataforma());

CREATE POLICY "Gerenciamento restrito para Admin Lab" 
ON public.profile_escolas 
FOR ALL 
USING (
    EXISTS ( 
        SELECT 1 FROM public.profile_escolas pe_admin
        WHERE pe_admin.profile_id = auth.uid() 
        AND pe_admin.escola_id = public.profile_escolas.escola_id 
        AND pe_admin.papel = 'admin_lab'
    )
);

-- Sincronizar vínculos faltantes de profiles para profile_escolas
INSERT INTO public.profile_escolas(profile_id, escola_id, papel, status, disciplinas)
SELECT id, escola_id, papel, status, disciplinas
FROM public.profiles
WHERE escola_id IS NOT NULL
ON CONFLICT (profile_id, escola_id) DO NOTHING;
