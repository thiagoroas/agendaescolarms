-- Revogar permissões amplas se existirem
DROP POLICY IF EXISTS "Usuários podem ver seus próprios vínculos" ON public.profile_escolas;
DROP POLICY IF EXISTS "Admins de escola podem ver vínculos da sua escola" ON public.profile_escolas;
DROP POLICY IF EXISTS "Admins de plataforma podem gerenciar vínculos" ON public.profile_escolas;

-- Nova Política: Somente vínculos onde o usuário é o dono OU onde ele é Admin Lab da escola
CREATE POLICY "Acesso restrito por vínculo"
ON public.profile_escolas
FOR SELECT
USING (
    auth.uid() = profile_id -- Próprio vínculo
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND papel = 'admin_plataforma'
    ) -- Admin Global
    OR
    EXISTS (
        SELECT 1 FROM public.profile_escolas pe_admin
        WHERE pe_admin.profile_id = auth.uid() 
        AND pe_admin.escola_id = public.profile_escolas.escola_id 
        AND pe_admin.papel = 'admin_lab'
    ) -- Admin da Escola vê quem está vinculado à escola dele
);

-- Garantir que INSERT/UPDATE/DELETE só possa ser feito por Admin Plataforma ou Admin Lab daquela escola
CREATE POLICY "Gerenciamento restrito de vínculos"
ON public.profile_escolas
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND papel = 'admin_plataforma'
    )
    OR
    EXISTS (
        SELECT 1 FROM public.profile_escolas pe_admin
        WHERE pe_admin.profile_id = auth.uid() 
        AND pe_admin.escola_id = public.profile_escolas.escola_id 
        AND pe_admin.papel = 'admin_lab'
    )
);
