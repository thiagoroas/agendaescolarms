-- ==========================================
-- AGENDA ESCOLAR DIGITAL - SETUP SUPABASE COMPLETO
-- Versão 1.2 - Implantação Real (Revisada e Corrigida)
-- ==========================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS

-- ESCOLAS
CREATE TABLE IF NOT EXISTS public.escolas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    cidade TEXT,
    uf CHAR(2),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- PROFILES (Vínculo com Auth.Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    nome TEXT,
    escola_id UUID REFERENCES public.escolas(id),
    papel TEXT NOT NULL DEFAULT 'professor' CHECK (papel IN ('admin_plataforma', 'admin_lab', 'professor')),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('ativo', 'pendente', 'suspenso')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RECURSOS (Laboratórios, Projetores, etc.)
CREATE TABLE IF NOT EXISTS public.recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'laboratorio', 'equipamento'
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RESERVAS
CREATE TABLE IF NOT EXISTS public.reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    recurso_id UUID NOT NULL REFERENCES public.recursos(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    aula INT NOT NULL CHECK (aula BETWEEN 1 AND 8),
    disciplina TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmada', 'cancelada', 'finalizada', 'manutencao', 'bloqueada')),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- AVISOS LABORATÓRIO
CREATE TABLE IF NOT EXISTS public.avisos_laboratorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    recurso_id UUID REFERENCES public.recursos(id) ON DELETE SET NULL, -- Opcional
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'informativo' CHECK (tipo IN ('informativo', 'atencao', 'urgente')),
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    exibir_dashboard BOOLEAN DEFAULT true,
    exibir_agenda BOOLEAN DEFAULT true,
    exigir_confirmacao BOOLEAN DEFAULT false,
    criado_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES public.escolas(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    tabela TEXT NOT NULL,
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SEGURANÇA (RLS)
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- 4. FUNÇÕES DE SUPORTE
CREATE OR REPLACE FUNCTION public.is_admin_plataforma()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND papel = 'admin_plataforma' AND status = 'ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_lab()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND papel = 'admin_lab' AND status = 'ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.my_escola_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT escola_id FROM public.profiles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.my_profile_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT id FROM public.profiles WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. POLICIES

-- ESCOLAS
CREATE POLICY "Admin Plataforma vê todas as escolas" ON public.escolas FOR SELECT USING (is_admin_plataforma());
CREATE POLICY "Usuário vê sua própria escola" ON public.escolas FOR SELECT USING (id = my_escola_id());
CREATE POLICY "Admin Plataforma gerencia escolas" ON public.escolas FOR ALL USING (is_admin_plataforma());

-- PROFILES
CREATE POLICY "Admin Plataforma gerencia todos os profiles" ON public.profiles FOR ALL USING (is_admin_plataforma());

CREATE POLICY "Admin Lab vê profiles da sua escola" ON public.profiles FOR SELECT 
USING (escola_id = my_escola_id());

CREATE POLICY "Admin Lab gerencia professores da sua escola" ON public.profiles FOR ALL
USING (escola_id = my_escola_id() AND is_admin_lab())
WITH CHECK (
    escola_id = my_escola_id() AND 
    papel = 'professor' AND 
    is_admin_lab()
);

CREATE POLICY "Professor vê seu próprio profile" ON public.profiles FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Professor vê outros professores da escola" ON public.profiles FOR SELECT 
USING (escola_id = my_escola_id());

-- RECURSOS
CREATE POLICY "Admin Plataforma vê todos os recursos" ON public.recursos FOR SELECT USING (is_admin_plataforma());
CREATE POLICY "Usuário vê recursos da sua escola" ON public.recursos FOR SELECT USING (escola_id = my_escola_id());
CREATE POLICY "Admin Lab gerencia recursos da sua escola" ON public.recursos FOR ALL 
USING (escola_id = my_escola_id() AND (is_admin_lab() OR is_admin_plataforma()))
WITH CHECK (escola_id = my_escola_id());

-- RESERVAS
CREATE POLICY "Admin Plataforma vê todas as reservas" ON public.reservas FOR SELECT USING (is_admin_plataforma());
CREATE POLICY "Usuário vê reservas da sua escola" ON public.reservas FOR SELECT USING (escola_id = my_escola_id());

CREATE POLICY "Professor cria reservas na sua escola" ON public.reservas FOR INSERT 
WITH CHECK (
    escola_id = my_escola_id() AND 
    professor_id = my_profile_id() AND
    status IN ('confirmada', 'cancelada')
);

CREATE POLICY "Professor altera sua própria reserva" ON public.reservas FOR UPDATE
USING (professor_id = my_profile_id())
WITH CHECK (professor_id = my_profile_id());

CREATE POLICY "Admin Lab gerencia todas as reservas da escola" ON public.reservas FOR ALL
USING (escola_id = my_escola_id() AND (is_admin_lab() OR is_admin_plataforma()))
WITH CHECK (escola_id = my_escola_id());

-- AVISOS
CREATE POLICY "Usuário vê avisos da sua escola" ON public.avisos_laboratorio FOR SELECT 
USING (escola_id = my_escola_id() OR is_admin_plataforma());

CREATE POLICY "Admin Lab gerencia avisos da sua escola" ON public.avisos_laboratorio FOR ALL
USING (escola_id = my_escola_id() AND (is_admin_lab() OR is_admin_plataforma()))
WITH CHECK (escola_id = my_escola_id());

-- LOGS
CREATE POLICY "Admin Plataforma vê todos os logs" ON public.logs_auditoria FOR SELECT USING (is_admin_plataforma());
CREATE POLICY "Admin Lab vê logs da sua escola" ON public.logs_auditoria FOR SELECT USING (escola_id = my_escola_id());
CREATE POLICY "Qualquer usuário pode inserir logs das suas ações" ON public.logs_auditoria FOR INSERT 
WITH CHECK (user_id = my_profile_id());

-- 6. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_escola_id ON public.profiles(escola_id);
CREATE INDEX IF NOT EXISTS idx_recursos_escola_id ON public.recursos(escola_id);
CREATE INDEX IF NOT EXISTS idx_reservas_escola_id ON public.reservas(escola_id);
CREATE INDEX IF NOT EXISTS idx_reservas_recurso_id ON public.reservas(recurso_id);
CREATE INDEX IF NOT EXISTS idx_reservas_professor_id ON public.reservas(professor_id);
CREATE INDEX IF NOT EXISTS idx_reservas_data ON public.reservas(data);
CREATE INDEX IF NOT EXISTS idx_avisos_escola_id ON public.avisos_laboratorio(escola_id);
CREATE INDEX IF NOT EXISTS idx_avisos_recurso_id ON public.avisos_laboratorio(recurso_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs_auditoria(user_id);

-- Único índice parcial para evitar conflitos de reserva (mesma escola, mesmo recurso, mesma data, mesma aula, se ativa)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_conflito_unico 
ON public.reservas (escola_id, recurso_id, data, aula) 
WHERE (status IN ('confirmada', 'manutencao', 'bloqueada'));

-- 7. TRIGGER: CRIAÇÃO AUTOMÁTICA DE PROFILE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, papel, status)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nome', 'professor', 'pendente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. SEEDS INICIAIS (REAIS)

-- Escolas
INSERT INTO public.escolas (nome, cidade, uf)
VALUES 
    ('E.E. 26 de Agosto — Campo Grande — MS', 'Campo Grande', 'MS'),
    ('E.E. Maria Eliza Bocayuva Corrêa — Campo Grande — MS', 'Campo Grande', 'MS')
ON CONFLICT (nome) DO NOTHING;

-- Recursos (Assumindo IDs baseados nos nomes inseridos)
DO $$
DECLARE
    escola1_id UUID;
    escola2_id UUID;
BEGIN
    SELECT id INTO escola1_id FROM public.escolas WHERE nome = 'E.E. 26 de Agosto — Campo Grande — MS';
    SELECT id INTO escola2_id FROM public.escolas WHERE nome = 'E.E. Maria Eliza Bocayuva Corrêa — Campo Grande — MS';

    IF escola1_id IS NOT NULL THEN
        INSERT INTO public.recursos (escola_id, nome, tipo) VALUES (escola1_id, 'Laboratório de Informática', 'laboratorio');
        INSERT INTO public.recursos (escola_id, nome, tipo) VALUES (escola1_id, 'Projetor', 'equipamento');
    END IF;

    IF escola2_id IS NOT NULL THEN
        INSERT INTO public.recursos (escola_id, nome, tipo) VALUES (escola2_id, 'Laboratório de Informática', 'laboratorio');
        INSERT INTO public.recursos (escola_id, nome, tipo) VALUES (escola2_id, 'Projetor', 'equipamento');
    END IF;
END $$;

-- 9. COMANDO DE PROMOÇÃO DE ADMIN (COMENTADO)
-- Execute este comando APÓS o usuário thiagomroas@gmail.com se cadastrar no app
-- UPDATE public.profiles SET papel = 'admin_plataforma', status = 'ativo' WHERE email = 'thiagomroas@gmail.com';
