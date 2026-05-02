-- ==========================================
-- AGENDA ESCOLAR DIGITAL - SETUP SUPABASE
-- Versão 1.0 - Implantação Real
-- ==========================================

-- 1. EXTENSÕES
-- Habilita suporte a UUIDs aleatórios
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CRIAÇÃO DAS TABELAS

-- ESCOLAS
CREATE TABLE IF NOT EXISTS public.escolas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cidade TEXT,
    estado TEXT,
    endereco TEXT,
    telefone TEXT,
    status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (Perfis de Usuários vinculados ao Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    escola_id UUID REFERENCES public.escolas(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    papel TEXT NOT NULL DEFAULT 'professor' CHECK (papel IN ('admin_plataforma', 'admin_lab', 'professor')),
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RECURSOS (Laboratórios, Projetores, etc.)
CREATE TABLE IF NOT EXISTS public.recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'laboratorio', -- laboratorio, projetor, sala, etc
    descricao TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'manutencao', 'inativo')),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RESERVAS
CREATE TABLE IF NOT EXISTS public.reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    recurso_id UUID NOT NULL REFERENCES public.recursos(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    turma TEXT NOT NULL,
    data DATE NOT NULL,
    aula TEXT NOT NULL, -- Ex: '1', '2', '3' ou 'Aula 1'
    objetivo TEXT,
    status TEXT DEFAULT 'confirmada' CHECK (status IN ('confirmada', 'cancelada', 'pendente', 'manutencao', 'bloqueada')),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- AVISOS DO LABORATÓRIO
CREATE TABLE IF NOT EXISTS public.avisos_laboratorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT DEFAULT 'info' CHECK (tipo IN ('info', 'aviso', 'erro')),
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    acao TEXT NOT NULL,
    tabela TEXT NOT NULL,
    item_id UUID,
    detalhes JSONB,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CONSTRAINTS ESPECIAIS

-- Impede conflito de reserva: Mesma escola + recurso + data + aula 
-- Somente para reservas que estão ocupando o espaço de fato.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reserva_conflito_unico 
ON public.reservas (escola_id, recurso_id, data, aula) 
WHERE (status IN ('confirmada', 'manutencao', 'bloqueada'));

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_escola_id ON public.profiles(escola_id);
CREATE INDEX IF NOT EXISTS idx_recursos_escola_id ON public.recursos(escola_id);
CREATE INDEX IF NOT EXISTS idx_reservas_escola_id ON public.reservas(escola_id);
CREATE INDEX IF NOT EXISTS idx_reservas_recurso_id ON public.reservas(recurso_id);
CREATE INDEX IF NOT EXISTS idx_reservas_professor_id ON public.reservas(professor_id);
CREATE INDEX IF NOT EXISTS idx_reservas_data ON public.reservas(data);
CREATE INDEX IF NOT EXISTS idx_avisos_escola_id ON public.avisos_laboratorio(escola_id);
CREATE INDEX IF NOT EXISTS idx_logs_escola_id ON public.logs_auditoria(escola_id);

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- 6. FUNÇÕES AUXILIARES DE SEGURANÇA

-- Retorna o perfil do usuário logado
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (id UUID, papel TEXT, escola_id UUID) AS $$
    SELECT id, papel, escola_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Verifica se é Admin Plataforma
CREATE OR REPLACE FUNCTION public.is_admin_plataforma()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND papel = 'admin_plataforma'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Verifica se é Admin Lab
CREATE OR REPLACE FUNCTION public.is_admin_lab()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND papel = 'admin_lab'
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Retorna a escola do usuário logado
CREATE OR REPLACE FUNCTION public.my_escola_id()
RETURNS UUID AS $$
    SELECT escola_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 7. POLÍTICAS RLS

-- ESCOLAS
CREATE POLICY "Admin Plataforma pode tudo em escolas" ON public.escolas
    FOR ALL USING (is_admin_plataforma());
CREATE POLICY "Usuários podem ver sua própria escola" ON public.escolas
    FOR SELECT USING (id = my_escola_id());

-- PROFILES
CREATE POLICY "Admin Plataforma pode tudo em perfis" ON public.profiles
    FOR ALL USING (is_admin_plataforma());
CREATE POLICY "Admin Lab pode gerenciar perfis da escola" ON public.profiles
    FOR ALL USING (escola_id = my_escola_id() AND is_admin_lab());
CREATE POLICY "Professores podem ver perfis da mesma escola" ON public.profiles
    FOR SELECT USING (escola_id = my_escola_id());

-- RECURSOS
CREATE POLICY "Admin Plataforma pode tudo em recursos" ON public.recursos
    FOR ALL USING (is_admin_plataforma());
CREATE POLICY "Admin Lab pode gerenciar recursos da escola" ON public.recursos
    FOR ALL USING (escola_id = my_escola_id() AND is_admin_lab());
CREATE POLICY "Professores podem ver recursos da escola" ON public.recursos
    FOR SELECT USING (escola_id = my_escola_id());

-- RESERVAS
CREATE POLICY "Admin Plataforma pode tudo em reservas" ON public.reservas
    FOR ALL USING (is_admin_plataforma());
CREATE POLICY "Admin Lab pode gerenciar todas as reservas da escola" ON public.reservas
    FOR ALL USING (escola_id = my_escola_id() AND is_admin_lab());
CREATE POLICY "Professores podem ver reservas da escola" ON public.reservas
    FOR SELECT USING (escola_id = my_escola_id());
CREATE POLICY "Professores podem criar e gerenciar suas próprias reservas" ON public.reservas
    FOR ALL USING (professor_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND escola_id = my_escola_id());

-- AVISOS
CREATE POLICY "Admin Plataforma pode tudo em avisos" ON public.avisos_laboratorio
    FOR ALL USING (is_admin_plataforma());
CREATE POLICY "Admin Lab pode gerenciar avisos da escola" ON public.avisos_laboratorio
    FOR ALL USING (escola_id = my_escola_id() AND is_admin_lab());
CREATE POLICY "Professores podem ver avisos ativos da escola" ON public.avisos_laboratorio
    FOR SELECT USING (escola_id = my_escola_id() AND ativo = true);

-- 8. TRIGGER DE CRIAÇÃO AUTOMÁTICA DE PERFIL
-- Cria um perfil automaticamente quando um novo usuário se cadastra no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, papel, status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Novo Usuário'), 
    NEW.email, 
    'professor', 
    'ativo'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. DADOS INICIAIS (SEED)
INSERT INTO public.escolas (nome, cidade, estado) VALUES 
('E.E. 26 de Agosto', 'Campo Grande', 'MS'),
('E.E. Maria Eliza Bocayuva Corrêa', 'Campo Grande', 'MS');

-- Inserindo recursos para as escolas recém criadas
-- Nota: Usamos subqueries para pegar os IDs gerados
INSERT INTO public.recursos (escola_id, nome, tipo, descricao)
SELECT id, 'Laboratório de Informática', 'laboratorio', 'Laboratório principal com 30 computadores'
FROM public.escolas WHERE nome = 'E.E. 26 de Agosto';

INSERT INTO public.recursos (escola_id, nome, tipo, descricao)
SELECT id, 'Projetor', 'projetor', 'Projetor móvel EPSON'
FROM public.escolas WHERE nome = 'E.E. 26 de Agosto';

INSERT INTO public.recursos (escola_id, nome, tipo, descricao)
SELECT id, 'Laboratório de Informática', 'laboratorio', 'Laboratório de tecnologia'
FROM public.escolas WHERE nome = 'E.E. Maria Eliza Bocayuva Corrêa';

INSERT INTO public.recursos (escola_id, nome, tipo, descricao)
SELECT id, 'Projetor', 'projetor', 'Projetor para sala de aula'
FROM public.escolas WHERE nome = 'E.E. Maria Eliza Bocayuva Corrêa';

-- 10. INSTRUÇÃO PARA PROMOÇÃO DE ADMIN
-- IMPORTANTE: Execute este comando APÓS o usuário thiagomroas@gmail.com se cadastrar.
/*
UPDATE public.profiles 
SET papel = 'admin_plataforma', status = 'ativo' 
WHERE email = 'thiagomroas@gmail.com';
*/

COMMENT ON TABLE public.escolas IS 'Lista de escolas cadastradas no sistema.';
COMMENT ON TABLE public.profiles IS 'Perfis de usuários vinculados ao Supabase Auth.';
COMMENT ON TABLE public.recursos IS 'Recursos agendáveis (laboratórios, equipamentos) de cada escola.';
COMMENT ON TABLE public.reservas IS 'Registros de agendamentos feitos pelos professores.';
COMMENT ON TABLE public.avisos_laboratorio IS 'Mensagens e alertas exibidos na agenda de cada escola.';
COMMENT ON TABLE public.logs_auditoria IS 'Histórico de ações importantes para rastreabilidade.';
