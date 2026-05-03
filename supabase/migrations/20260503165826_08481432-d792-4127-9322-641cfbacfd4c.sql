-- Criar a tabela de horários por escola
CREATE TABLE IF NOT EXISTS public.horarios_escola (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    turno TEXT NOT NULL DEFAULT 'manha',
    ordem INTEGER NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('aula', 'intervalo')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(escola_id, ordem)
);

-- Habilitar RLS
ALTER TABLE public.horarios_escola ENABLE ROW LEVEL SECURITY;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_horarios_escola_escola_id ON public.horarios_escola(escola_id);
CREATE INDEX IF NOT EXISTS idx_horarios_escola_escola_id_ordem ON public.horarios_escola(escola_id, ordem);

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER set_updated_at_horarios
    BEFORE UPDATE ON public.horarios_escola
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Políticas RLS

-- 1. Admin Plataforma pode tudo
CREATE POLICY "Admin plataforma pode tudo em horarios"
ON public.horarios_escola
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.papel = 'admin_plataforma'
    )
);

-- 2. Admin Lab e Usuário Lab podem visualizar/editar apenas da própria escola
CREATE POLICY "Admin lab pode gerenciar horarios da propria escola"
ON public.horarios_escola
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.papel = 'admin_lab' OR profiles.papel = 'usuario_lab')
        AND profiles.escola_id = horarios_escola.escola_id
    )
);

-- 3. Professor e outros podem apenas visualizar horários ativos da própria escola
CREATE POLICY "Professores podem visualizar horarios da propria escola"
ON public.horarios_escola
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.escola_id = horarios_escola.escola_id
    )
    AND ativo = true
);

-- Seed de horários padrão para escolas existentes
DO $$
DECLARE
    escola_rec RECORD;
BEGIN
    FOR escola_rec IN SELECT id FROM public.escolas LOOP
        -- Manhã
        INSERT INTO public.horarios_escola (escola_id, nome, turno, ordem, hora_inicio, hora_fim, tipo) VALUES
        (escola_rec.id, '1ª Aula', 'manha', 1, '07:00', '07:50', 'aula'),
        (escola_rec.id, '2ª Aula', 'manha', 2, '07:50', '08:40', 'aula'),
        (escola_rec.id, 'Intervalo', 'manha', 3, '08:40', '09:00', 'intervalo'),
        (escola_rec.id, '3ª Aula', 'manha', 4, '09:00', '09:50', 'aula'),
        (escola_rec.id, '4ª Aula', 'manha', 5, '09:50', '10:40', 'aula'),
        (escola_rec.id, '5ª Aula', 'manha', 6, '10:40', '11:30', 'aula'),
        -- Tarde
        (escola_rec.id, '6ª Aula', 'tarde', 7, '13:00', '13:50', 'aula'),
        (escola_rec.id, '7ª Aula', 'tarde', 8, '13:50', '14:40', 'aula'),
        (escola_rec.id, 'Intervalo', 'tarde', 9, '14:40', '15:00', 'intervalo'),
        (escola_rec.id, '8ª Aula', 'tarde', 10, '15:00', '15:50', 'aula'),
        (escola_rec.id, '9ª Aula', 'tarde', 11, '15:50', '16:40', 'aula'),
        (escola_rec.id, '10ª Aula', 'tarde', 12, '16:40', '17:30', 'aula')
        ON CONFLICT (escola_id, ordem) DO NOTHING;
    END LOOP;
END $$;
