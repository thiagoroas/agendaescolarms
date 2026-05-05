-- Criar tabela de vínculo entre usuário e escola
CREATE TABLE IF NOT EXISTS public.profile_escolas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    papel TEXT NOT NULL DEFAULT 'professor',
    status TEXT NOT NULL DEFAULT 'ativo',
    disciplinas TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(profile_id, escola_id)
);

-- Habilitar RLS
ALTER TABLE public.profile_escolas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para profile_escolas
CREATE POLICY "Usuários podem ver seus próprios vínculos"
ON public.profile_escolas
FOR SELECT
USING (auth.uid() = profile_id OR (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND papel = 'admin_plataforma'
)));

CREATE POLICY "Admins de escola podem ver vínculos da sua escola"
ON public.profile_escolas
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profile_escolas 
    WHERE profile_id = auth.uid() 
    AND escola_id = profile_escolas.escola_id 
    AND papel = 'admin_lab'
));

CREATE POLICY "Admins de plataforma podem gerenciar vínculos"
ON public.profile_escolas
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND papel = 'admin_plataforma'
));

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_profile_escolas_updated_at
BEFORE UPDATE ON public.profile_escolas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migração de dados iniciais
INSERT INTO public.profile_escolas(profile_id, escola_id, papel, status, disciplinas)
SELECT id, escola_id, papel, status, disciplinas
FROM public.profiles
WHERE escola_id IS NOT NULL
ON CONFLICT (profile_id, escola_id) DO NOTHING;
