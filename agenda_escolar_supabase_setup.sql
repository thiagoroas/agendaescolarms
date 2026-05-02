-- ==========================================
-- AGENDA ESCOLAR DIGITAL - SETUP SUPABASE COMPLETO
-- Versão 1.6 - Final (Correções de Segurança e Estrutura)
-- ==========================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS

-- Escolas
CREATE TABLE IF NOT EXISTS escolas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    cidade TEXT,
    estado TEXT,
    logo_url TEXT,
    status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    configuracoes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles (id = auth.users.id)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    escola_id UUID REFERENCES escolas(id),
    papel TEXT NOT NULL DEFAULT 'professor' CHECK (papel IN ('admin_plataforma', 'admin_lab', 'professor')),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('ativo', 'pendente', 'bloqueado')),
    disciplinas TEXT[] DEFAULT '{}',
    avatar_url TEXT,
    telefone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Recursos
CREATE TABLE IF NOT EXISTS recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('sala', 'equipamento', 'laboratorio')),
    descricao TEXT,
    capacidade INTEGER,
    cor_fundo TEXT DEFAULT '#3b82f6',
    cor_texto TEXT DEFAULT '#ffffff',
    cor_borda TEXT DEFAULT '#2563eb',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(escola_id, nome)
);

-- Reservas
CREATE TABLE IF NOT EXISTS reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
    recurso_id UUID REFERENCES recursos(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id),
    nome_professor TEXT NOT NULL,
    disciplina TEXT NOT NULL,
    turma TEXT NOT NULL,
    data DATE NOT NULL,
    aula INTEGER NOT NULL CHECK (aula BETWEEN 1 AND 8),
    horario TEXT,
    status TEXT NOT NULL DEFAULT 'confirmada' CHECK (status IN ('confirmada', 'cancelada', 'finalizada', 'manutencao', 'bloqueada')),
    objetivo_pedagogico TEXT,
    observacao TEXT,
    motivo_cancelamento TEXT,
    criado_por UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Avisos Laboratório
CREATE TABLE IF NOT EXISTS avisos_laboratorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
    recurso_id UUID REFERENCES recursos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'informativo' CHECK (tipo IN ('informativo', 'atencao', 'urgente')),
    ativo BOOLEAN DEFAULT true,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    hora_inicio TIME,
    hora_fim TIME,
    exibir_na_agenda BOOLEAN DEFAULT true,
    exibir_no_modal_reserva BOOLEAN DEFAULT true,
    exibir_no_dashboard BOOLEAN DEFAULT true,
    exigir_confirmacao BOOLEAN DEFAULT false,
    criado_por UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Logs Auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID REFERENCES escolas(id),
    profile_id UUID REFERENCES profiles(id),
    acao TEXT NOT NULL,
    tabela TEXT NOT NULL,
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_profiles_escola ON profiles(escola_id);
CREATE INDEX IF NOT EXISTS idx_recursos_escola ON recursos(escola_id);
CREATE INDEX IF NOT EXISTS idx_reservas_escola_data ON reservas(escola_id, data);
CREATE INDEX IF NOT EXISTS idx_reservas_recurso ON reservas(recurso_id);
CREATE INDEX IF NOT EXISTS idx_avisos_escola ON avisos_laboratorio(escola_id);
CREATE INDEX IF NOT EXISTS idx_avisos_recurso ON avisos_laboratorio(recurso_id);
CREATE INDEX IF NOT EXISTS idx_logs_escola ON logs_auditoria(escola_id);
CREATE INDEX IF NOT EXISTS idx_logs_profile ON logs_auditoria(profile_id);

-- Unique Index Parcial para evitar conflitos de reserva
CREATE UNIQUE INDEX IF NOT EXISTS idx_conflito_reserva_parcial 
ON reservas (escola_id, recurso_id, data, aula) 
WHERE status IN ('confirmada', 'manutencao', 'bloqueada');

-- 4. FUNÇÕES AUXILIARES (SECURITY DEFINER)

CREATE OR REPLACE FUNCTION is_admin_plataforma()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND papel = 'admin_plataforma' 
    AND status = 'ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin_lab()
RETURNS BOOLEAN AS $$
BEGIN
  -- Corrigido: Apenas admin_lab, sem admin_plataforma aqui
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND papel = 'admin_lab' 
    AND status = 'ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION my_escola_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT escola_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION my_profile_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, status, papel)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    'pendente', 
    'professor'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. RLS (ROW LEVEL SECURITY)

ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas Escolas
CREATE POLICY "Admin Plataforma pode tudo em escolas" ON escolas FOR ALL TO authenticated USING (is_admin_plataforma());
CREATE POLICY "Usuários podem ver sua própria escola" ON escolas FOR SELECT TO authenticated USING (id = my_escola_id());

-- Políticas Profiles
CREATE POLICY "Admin Plataforma pode tudo em profiles" ON profiles FOR ALL TO authenticated USING (is_admin_plataforma());

CREATE POLICY "Admin Lab pode ver profiles da escola" ON profiles FOR SELECT TO authenticated 
USING (is_admin_lab() AND escola_id = my_escola_id());

CREATE POLICY "Admin Lab pode inserir professores na escola" ON profiles FOR INSERT TO authenticated 
WITH CHECK (is_admin_lab() AND escola_id = my_escola_id() AND papel = 'professor');

CREATE POLICY "Admin Lab pode atualizar professores na escola" ON profiles FOR UPDATE TO authenticated 
USING (is_admin_lab() AND escola_id = my_escola_id() AND papel = 'professor');

CREATE POLICY "Admin Lab pode deletar professores na escola" ON profiles FOR DELETE TO authenticated 
USING (is_admin_lab() AND escola_id = my_escola_id() AND papel = 'professor');

CREATE POLICY "Usuários podem ver seu próprio profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
-- Nota: Política de UPDATE do próprio profile removida/restrita para ser feita via RPC ou restrita a campos seguros
-- CREATE POLICY "Usuários podem atualizar seu próprio profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Usuários podem ver colegas da mesma escola" ON profiles FOR SELECT TO authenticated USING (escola_id = my_escola_id());

-- Políticas Recursos
CREATE POLICY "Admin Plataforma pode tudo em recursos" ON recursos FOR ALL TO authenticated USING (is_admin_plataforma());
CREATE POLICY "Admin Lab pode gerenciar recursos da escola" ON recursos FOR ALL TO authenticated USING (is_admin_lab() AND escola_id = my_escola_id());
CREATE POLICY "Todos podem ver recursos da escola" ON recursos FOR SELECT TO authenticated USING (escola_id = my_escola_id());

-- Políticas Reservas
CREATE POLICY "Admin Plataforma pode tudo em reservas" ON reservas FOR ALL TO authenticated USING (is_admin_plataforma());
CREATE POLICY "Admin Lab pode gerenciar reservas da escola" ON reservas FOR ALL TO authenticated USING (is_admin_lab() AND escola_id = my_escola_id());
CREATE POLICY "Professores podem ver reservas da escola" ON reservas FOR SELECT TO authenticated USING (escola_id = my_escola_id());

-- Corrigido: Professor só cria para si mesmo, na sua escola e com status confirmada
CREATE POLICY "Professores podem criar reservas" ON reservas FOR INSERT TO authenticated 
WITH CHECK (
    escola_id = my_escola_id() 
    AND profile_id = auth.uid() 
    AND status = 'confirmada'
);

-- Corrigido: Professor só altera suas próprias reservas da sua escola
CREATE POLICY "Professores podem alterar suas próprias reservas" ON reservas FOR UPDATE TO authenticated 
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid() AND escola_id = my_escola_id());

-- Políticas Avisos
CREATE POLICY "Admin Plataforma pode tudo em avisos" ON avisos_laboratorio FOR ALL TO authenticated USING (is_admin_plataforma());
CREATE POLICY "Admin Lab pode gerenciar avisos da escola" ON avisos_laboratorio FOR ALL TO authenticated USING (is_admin_lab() AND escola_id = my_escola_id());
CREATE POLICY "Todos podem ver avisos da escola" ON avisos_laboratorio FOR SELECT TO authenticated USING (escola_id = my_escola_id());

-- Políticas Logs
CREATE POLICY "Admin Plataforma pode tudo em logs" ON logs_auditoria FOR ALL TO authenticated USING (is_admin_plataforma());
CREATE POLICY "Admin Lab pode ver logs da escola" ON logs_auditoria FOR SELECT TO authenticated USING (is_admin_lab() AND escola_id = my_escola_id());
CREATE POLICY "Qualquer um pode inserir logs" ON logs_auditoria FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

-- 6. SEEDS (ESCOLAS E RECURSOS REAIS)

DO $$
DECLARE
    escola1_id UUID;
    escola2_id UUID;
BEGIN
    -- Inserir Escolas Reais
    INSERT INTO escolas (nome, cidade, estado, status)
    VALUES ('E.E. 26 de Agosto', 'Campo Grande', 'MS', 'ativa')
    ON CONFLICT (nome) DO NOTHING;

    INSERT INTO escolas (nome, cidade, estado, status)
    VALUES ('E.E. Maria Eliza Bocayuva Corrêa', 'Campo Grande', 'MS', 'ativa')
    ON CONFLICT (nome) DO NOTHING;

    -- Capturar IDs
    SELECT id INTO escola1_id FROM escolas WHERE nome = 'E.E. 26 de Agosto';
    SELECT id INTO escola2_id FROM escolas WHERE nome = 'E.E. Maria Eliza Bocayuva Corrêa';

    -- Inserir Recursos para Escola 1 (26 de Agosto)
    IF escola1_id IS NOT NULL THEN
        INSERT INTO recursos (escola_id, nome, tipo, cor_fundo, cor_texto, cor_borda)
        VALUES 
        (escola1_id, 'Laboratório de Informática', 'laboratorio', '#e3f2fd', '#1565c0', '#bbdefb'),
        (escola1_id, 'Projetor', 'equipamento', '#f3e5f5', '#7b1fa2', '#e1bee7')
        ON CONFLICT (escola_id, nome) DO NOTHING;
    END IF;

    -- Inserir Recursos para Escola 2 (Maria Eliza)
    IF escola2_id IS NOT NULL THEN
        INSERT INTO recursos (escola_id, nome, tipo, cor_fundo, cor_texto, cor_borda)
        VALUES 
        (escola2_id, 'Laboratório de Informática', 'laboratorio', '#e3f2fd', '#1565c0', '#bbdefb'),
        (escola2_id, 'Projetor', 'equipamento', '#f3e5f5', '#7b1fa2', '#e1bee7')
        ON CONFLICT (escola_id, nome) DO NOTHING;
    END IF;
END $$;

-- 7. COMANDO PARA PROMOVER ADMIN (EXECUTAR MANUALMENTE NO SQL EDITOR APÓS O LOGIN DO USUÁRIO)
/*
UPDATE public.profiles 
SET papel = 'admin_plataforma', status = 'ativo' 
WHERE email = 'thiagomroas@gmail.com';
*/
