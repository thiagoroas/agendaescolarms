-- ==========================================
-- AGENDA ESCOLAR DIGITAL - SETUP SUPABASE COMPLETO
-- Versão 1.1 - Implantação Real (Corrigida)
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
    estado TEXT,
    endereco TEXT,
    telefone TEXT,
    status TEXT DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa')),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (Vínculo entre Auth.Users e dados da aplicação)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    escola_id UUID REFERENCES public.escolas(id),
    papel TEXT NOT NULL CHECK (papel IN ('admin_plataforma', 'admin_lab', 'professor')),
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'pendente', 'bloqueado')),
    disciplinas TEXT[] DEFAULT '{}',
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RECURSOS (Laboratórios, Salas, Tablets, etc)
CREATE TABLE IF NOT EXISTS public.recursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'informatica', 'ciencias', 'multimidia', etc
    cor_fundo TEXT DEFAULT '#e5e7eb',
    cor_texto TEXT DEFAULT '#374151',
    cor_borda TEXT DEFAULT '#d1d5db',
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- RESERVAS
CREATE TABLE IF NOT EXISTS public.reservas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    recurso_id UUID NOT NULL REFERENCES public.recursos(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES public.profiles(id),
    nome_professor TEXT NOT NULL,
    disciplina TEXT,
    turma TEXT NOT NULL,
    data DATE NOT NULL,
    aula INTEGER NOT NULL CHECK (aula >= 1 AND aula <= 15),
    horario TEXT,
    status TEXT DEFAULT 'confirmada' CHECK (status IN ('confirmada', 'cancelada', 'finalizada', 'manutencao', 'bloqueada')),
    objetivo_pedagogico TEXT,
    observacao TEXT,
    motivo_cancelamento TEXT,
    criado_por UUID REFERENCES public.profiles(id),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- AVISOS DO LABORATÓRIO / ESCOLA
CREATE TABLE IF NOT EXISTS public.avisos_laboratorio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escola_id UUID NOT NULL REFERENCES public.escolas(id) ON DELETE CASCADE,
    recurso_id UUID REFERENCES public.recursos(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT DEFAULT 'informativo' CHECK (tipo IN ('informativo', 'atencao', 'urgente')),
    ativo BOOLEAN DEFAULT true,
    data_inicio DATE,
    data_fim DATE,
    hora_inicio TIME,
    hora_fim TIME,
    exibir_na_agenda BOOLEAN DEFAULT true,
    exibir_no_modal_reserva BOOLEAN DEFAULT false,
    exibir_no_dashboard BOOLEAN DEFAULT true,
    exigir_confirmacao BOOLEAN DEFAULT false,
    criado_por UUID REFERENCES public.profiles(id),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- LOGS DE AUDITORIA
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    acao TEXT NOT NULL,
    tabela TEXT,
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ÍNDICES E CONSTRAINTS DE CONFLITO

-- Impedir reserva duplicada (mesma escola, mesmo recurso, mesma data e aula)
-- Somente para reservas ativas que bloqueiam o horário
CREATE UNIQUE INDEX IF NOT EXISTS idx_conflito_reserva_ativa ON public.reservas (escola_id, recurso_id, data, aula)
WHERE (status IN ('confirmada', 'manutencao', 'bloqueada'));

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_reservas_data ON public.reservas(data);
CREATE INDEX IF NOT EXISTS idx_reservas_escola ON public.reservas(escola_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);

-- 4. FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)

-- Retorna o profile do usuário logado
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (id UUID, user_id UUID, escola_id UUID, papel TEXT, status TEXT) 
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT id, user_id, escola_id, papel, status 
  FROM public.profiles 
  WHERE user_id = auth.uid();
$$;

-- Verifica se é Admin Plataforma
CREATE OR REPLACE FUNCTION public.is_admin_plataforma()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND papel = 'admin_plataforma' AND status = 'ativo'
  );
END;
$$;

-- Verifica se é Admin Lab
CREATE OR REPLACE FUNCTION public.is_admin_lab()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND papel = 'admin_lab' AND status = 'ativo'
  );
END;
$$;

-- Retorna o ID da escola do usuário logado
CREATE OR REPLACE FUNCTION public.my_escola_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT escola_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$;

-- Retorna o ID do profile do usuário logado
CREATE OR REPLACE FUNCTION public.my_profile_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1);
END;
$$;

-- 5. CONFIGURAÇÃO DE RLS (ROW LEVEL SECURITY)

ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- POLICIES: ESCOLAS
CREATE POLICY "Admin Plataforma pode tudo em escolas" ON public.escolas
    FOR ALL USING (public.is_admin_plataforma());

CREATE POLICY "Usuários autenticados podem ver escolas" ON public.escolas
    FOR SELECT USING (auth.role() = 'authenticated');

-- POLICIES: PROFILES
CREATE POLICY "Admin Plataforma pode tudo em profiles" ON public.profiles
    FOR ALL USING (public.is_admin_plataforma());

CREATE POLICY "Admin Lab gerencia profiles da própria escola" ON public.profiles
    FOR ALL USING (escola_id = public.my_escola_id() AND public.is_admin_lab());

CREATE POLICY "Usuários veem o próprio profile" ON public.profiles
    FOR SELECT USING (user_id = auth.uid());

-- POLICIES: RECURSOS
CREATE POLICY "Admin Plataforma pode tudo em recursos" ON public.recursos
    FOR ALL USING (public.is_admin_plataforma());

CREATE POLICY "Admin Lab gerencia recursos da própria escola" ON public.recursos
    FOR ALL USING (escola_id = public.my_escola_id() AND public.is_admin_lab());

CREATE POLICY "Usuários veem recursos da própria escola" ON public.recursos
    FOR SELECT USING (escola_id = public.my_escola_id());

-- POLICIES: RESERVAS
CREATE POLICY "Admin Plataforma pode tudo em reservas" ON public.reservas
    FOR ALL USING (public.is_admin_plataforma());

CREATE POLICY "Admin Lab gerencia reservas da própria escola" ON public.reservas
    FOR ALL USING (escola_id = public.my_escola_id() AND (public.is_admin_lab() OR public.is_admin_plataforma()));

CREATE POLICY "Professor cria reservas para si na própria escola" ON public.reservas
    FOR INSERT WITH CHECK (
        escola_id = public.my_escola_id() 
        AND professor_id = public.my_profile_id()
    );

CREATE POLICY "Professor altera/cancela as próprias reservas" ON public.reservas
    FOR UPDATE USING (professor_id = public.my_profile_id())
    WITH CHECK (professor_id = public.my_profile_id());

CREATE POLICY "Todos veem reservas da própria escola" ON public.reservas
    FOR SELECT USING (escola_id = public.my_escola_id());

-- POLICIES: AVISOS
CREATE POLICY "Admin Plataforma pode tudo em avisos" ON public.avisos_laboratorio
    FOR ALL USING (public.is_admin_plataforma());

CREATE POLICY "Admin Lab gerencia avisos da própria escola" ON public.avisos_laboratorio
    FOR ALL USING (escola_id = public.my_escola_id() AND public.is_admin_lab());

CREATE POLICY "Usuários veem avisos da própria escola" ON public.avisos_laboratorio
    FOR SELECT USING (escola_id = public.my_escola_id());

-- 6. TRIGGERS

-- Criar profile automaticamente ao criar usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome, papel, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), 
    'professor', 
    'ativo'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. SEED INICIAL (ESCOLAS E RECURSOS)

INSERT INTO public.escolas (nome, cidade, estado)
VALUES 
    ('Escola Estadual Padrão', 'São Paulo', 'SP'),
    ('Colégio Municipal Futuro', 'Rio de Janeiro', 'RJ')
ON CONFLICT (nome) DO NOTHING;

-- Inserir recursos padrão para a primeira escola encontrada
DO $$
DECLARE
    v_escola_id UUID;
BEGIN
    SELECT id INTO v_escola_id FROM public.escolas LIMIT 1;
    
    IF v_escola_id IS NOT NULL THEN
        INSERT INTO public.recursos (escola_id, nome, tipo, cor_fundo, cor_texto, cor_borda)
        VALUES 
            (v_escola_id, 'Laboratório de Informática 01', 'informatica', '#e0f2fe', '#0369a1', '#bae6fd'),
            (v_escola_id, 'Laboratório de Ciências', 'ciencias', '#f0fdf4', '#15803d', '#bbf7d0'),
            (v_escola_id, 'Sala Multimídia', 'multimidia', '#fefce8', '#a16207', '#fef08a')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 8. PROMOÇÃO DO PRIMEIRO ADMIN (INSTRUÇÕES)

/*
  PASSO A PASSO PARA INICIAR:
  
  1. No painel do Supabase, vá em 'Authentication' > 'Users' e crie um usuário com:
     Email: thiagomroas@gmail.com
     Senha: (sua escolha)
     
  2. Após criar o usuário, execute o comando abaixo no SQL Editor:
  
  UPDATE public.profiles 
  SET papel = 'admin_plataforma', status = 'ativo' 
  WHERE email = 'thiagomroas@gmail.com';
  
  3. Agora este usuário terá acesso total ao sistema.
*/
