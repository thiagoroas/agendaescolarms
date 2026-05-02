-- ==========================================
-- AGENDA ESCOLAR DIGITAL - SETUP SUPABASE COMPLETO
-- Versão 1.3 - Implantação Real (Campos e Segurança Finalizados)
-- ==========================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS

-- Escolas
CREATE TABLE IF NOT EXISTS escolas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL UNIQUE,
    cidade text NOT NULL,
    estado text NOT NULL,
    criado_em timestamptz DEFAULT now()
);

-- Profiles (Usuários)
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    escola_id uuid REFERENCES escolas(id),
    nome text NOT NULL,
    email text UNIQUE NOT NULL,
    papel text NOT NULL CHECK (papel IN ('admin_plataforma', 'admin_lab', 'professor')) DEFAULT 'professor',
    status text NOT NULL CHECK (status IN ('ativo', 'pendente', 'bloqueado')) DEFAULT 'pendente',
    disciplinas text[] DEFAULT '{}',
    criado_em timestamptz DEFAULT now()
);

-- Recursos (Laboratórios, Projetores, etc.)
CREATE TABLE IF NOT EXISTS recursos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    nome text NOT NULL,
    tipo text,
    cor_fundo text,
    cor_texto text,
    cor_borda text,
    ativo boolean DEFAULT true,
    criado_em timestamptz DEFAULT now(),
    UNIQUE (escola_id, nome)
);

-- Reservas
CREATE TABLE IF NOT EXISTS reservas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    recurso_id uuid NOT NULL REFERENCES recursos(id) ON DELETE CASCADE,
    professor_id uuid REFERENCES profiles(id),
    nome_professor text NOT NULL,
    disciplina text NOT NULL,
    turma text NOT NULL,
    data date NOT NULL,
    aula int NOT NULL CHECK (aula BETWEEN 1 AND 8),
    horario text,
    status text DEFAULT 'confirmada' CHECK (status IN ('confirmada','cancelada','finalizada','manutencao','bloqueada')),
    objetivo_pedagogico text,
    observacao text,
    motivo_cancelamento text,
    criado_por uuid REFERENCES profiles(id),
    criado_em timestamptz DEFAULT now()
);

-- Avisos do Laboratório
CREATE TABLE IF NOT EXISTS avisos_laboratorio (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id uuid NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    recurso_id uuid REFERENCES recursos(id) ON DELETE SET NULL,
    titulo text NOT NULL,
    mensagem text NOT NULL,
    tipo text CHECK (tipo IN ('informativo','atencao','urgente')),
    ativo boolean DEFAULT true,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    hora_inicio time,
    hora_fim time,
    exibir_na_agenda boolean DEFAULT true,
    exibir_no_modal_reserva boolean DEFAULT true,
    exibir_no_dashboard boolean DEFAULT false,
    exigir_confirmacao boolean DEFAULT false,
    criado_por uuid REFERENCES profiles(id),
    criado_em timestamptz DEFAULT now()
);

-- Logs de Auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id uuid REFERENCES escolas(id),
    profile_id uuid REFERENCES profiles(id),
    acao text NOT NULL,
    detalhes jsonb,
    ip_address text,
    criado_em timestamptz DEFAULT now()
);

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_escola_id ON profiles(escola_id);
CREATE INDEX IF NOT EXISTS idx_recursos_escola_id ON recursos(escola_id);
CREATE INDEX IF NOT EXISTS idx_reservas_escola_id ON reservas(escola_id);
CREATE INDEX IF NOT EXISTS idx_reservas_recurso_id ON reservas(recurso_id);
CREATE INDEX IF NOT EXISTS idx_reservas_professor_id ON reservas(professor_id);
CREATE INDEX IF NOT EXISTS idx_reservas_data ON reservas(data);
CREATE INDEX IF NOT EXISTS idx_avisos_escola_id ON avisos_laboratorio(escola_id);
CREATE INDEX IF NOT EXISTS idx_avisos_recurso_id ON avisos_laboratorio(recurso_id);
CREATE INDEX IF NOT EXISTS idx_logs_escola_id ON logs_auditoria(escola_id);
CREATE INDEX IF NOT EXISTS idx_logs_profile_id ON logs_auditoria(profile_id);

-- Único Index Parcial para Evitar Conflitos (Regra de Ouro)
-- Impede mesma escola, recurso, data e aula se a reserva estiver ativa/confirmada
CREATE UNIQUE INDEX IF NOT EXISTS idx_conflito_reserva 
ON reservas (escola_id, recurso_id, data, aula) 
WHERE status IN ('confirmada', 'manutencao', 'bloqueada');

-- 4. FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)

CREATE OR REPLACE FUNCTION is_admin_plataforma() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND papel = 'admin_plataforma' 
    AND status = 'ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_admin_lab() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND papel IN ('admin_lab', 'admin_plataforma') 
    AND status = 'ativo'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION my_escola_id() 
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT escola_id FROM profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION my_profile_id() 
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. RLS (ROW LEVEL SECURITY)

ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Policies: ESCOLAS
CREATE POLICY "Admin Plataforma pode tudo em escolas" ON escolas FOR ALL TO authenticated 
USING (is_admin_plataforma()) WITH CHECK (is_admin_plataforma());

CREATE POLICY "Qualquer logado vê escolas" ON escolas FOR SELECT TO authenticated USING (true);

-- Policies: PROFILES
CREATE POLICY "Admin Plataforma pode tudo em profiles" ON profiles FOR ALL TO authenticated 
USING (is_admin_plataforma()) WITH CHECK (is_admin_plataforma());

CREATE POLICY "Admin Lab vê e edita professores da própria escola" ON profiles FOR ALL TO authenticated
USING (
  escola_id = my_escola_id() 
  AND (papel = 'professor' OR user_id = auth.uid()) 
  AND is_admin_lab()
)
WITH CHECK (
  escola_id = my_escola_id() 
  AND papel = 'professor' 
  AND is_admin_lab()
);

CREATE POLICY "Usuário vê seu próprio profile" ON profiles FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Usuários da mesma escola se veem" ON profiles FOR SELECT TO authenticated 
USING (escola_id = my_escola_id());

-- Policies: RECURSOS
CREATE POLICY "Admin Plataforma pode tudo em recursos" ON recursos FOR ALL TO authenticated 
USING (is_admin_plataforma()) WITH CHECK (is_admin_plataforma());

CREATE POLICY "Admin Lab gerencia recursos da escola" ON recursos FOR ALL TO authenticated
USING (escola_id = my_escola_id() AND is_admin_lab())
WITH CHECK (escola_id = my_escola_id() AND is_admin_lab());

CREATE POLICY "Professores veem recursos da escola" ON recursos FOR SELECT TO authenticated 
USING (escola_id = my_escola_id());

-- Policies: RESERVAS
CREATE POLICY "Admin Plataforma pode tudo em reservas" ON reservas FOR ALL TO authenticated 
USING (is_admin_plataforma()) WITH CHECK (is_admin_plataforma());

CREATE POLICY "Admin Lab gerencia reservas da escola" ON reservas FOR ALL TO authenticated
USING (escola_id = my_escola_id() AND is_admin_lab())
WITH CHECK (escola_id = my_escola_id() AND is_admin_lab());

CREATE POLICY "Professor insere suas próprias reservas" ON reservas FOR INSERT TO authenticated
WITH CHECK (
  escola_id = my_escola_id() 
  AND professor_id = my_profile_id()
  AND status = 'confirmada'
);

CREATE POLICY "Professor edita suas próprias reservas" ON reservas FOR UPDATE TO authenticated
USING (professor_id = my_profile_id())
WITH CHECK (professor_id = my_profile_id());

CREATE POLICY "Usuários veem reservas da própria escola" ON reservas FOR SELECT TO authenticated 
USING (escola_id = my_escola_id());

-- Policies: AVISOS
CREATE POLICY "Admin Plataforma pode tudo em avisos" ON avisos_laboratorio FOR ALL TO authenticated 
USING (is_admin_plataforma()) WITH CHECK (is_admin_plataforma());

CREATE POLICY "Admin Lab gerencia avisos da escola" ON avisos_laboratorio FOR ALL TO authenticated
USING (escola_id = my_escola_id() AND is_admin_lab())
WITH CHECK (escola_id = my_escola_id() AND is_admin_lab());

CREATE POLICY "Usuários veem avisos da escola" ON avisos_laboratorio FOR SELECT TO authenticated 
USING (escola_id = my_escola_id() AND ativo = true);

-- Policies: LOGS
CREATE POLICY "Admin Plataforma vê logs" ON logs_auditoria FOR SELECT TO authenticated USING (is_admin_plataforma());
CREATE POLICY "Admin Lab vê logs da escola" ON logs_auditoria FOR SELECT TO authenticated USING (escola_id = my_escola_id() AND is_admin_lab());
CREATE POLICY "Sistema insere logs" ON logs_auditoria FOR INSERT TO authenticated WITH CHECK (profile_id = my_profile_id());

-- 6. TRIGGER: CRIAÇÃO AUTOMÁTICA DE PROFILE
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, papel, status, disciplinas)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'name', new.email),
    'professor',
    'pendente',
    '{}'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. SEEDS (DADOS INICIAIS)

-- Escolas Reais
INSERT INTO escolas (id, nome, cidade, estado)
VALUES 
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'E.E. 26 de Agosto', 'Campo Grande', 'MS'),
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'E.E. Maria Eliza Bocayuva Corrêa', 'Campo Grande', 'MS')
ON CONFLICT (nome) DO NOTHING;

-- Recursos Reais
INSERT INTO recursos (escola_id, nome, tipo, cor_fundo, cor_texto, cor_borda)
VALUES 
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'Laboratório de Informática', 'sala', '#e3f2fd', '#1976d2', '#bbdefb'),
  ('e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1', 'Projetor', 'equipamento', '#f3e5f5', '#7b1fa2', '#e1bee7'),
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'Laboratório de Informática', 'sala', '#e3f2fd', '#1976d2', '#bbdefb'),
  ('e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2', 'Projetor', 'equipamento', '#f3e5f5', '#7b1fa2', '#e1bee7')
ON CONFLICT (escola_id, nome) DO NOTHING;

-- 8. COMANDO PARA PROMOVER ADMIN (EXECUTAR MANUALMENTE APÓS O LOGIN DO USUÁRIO)
/*
UPDATE profiles 
SET papel = 'admin_plataforma', status = 'ativo' 
WHERE email = 'thiagomroas@gmail.com';
*/
