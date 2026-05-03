
-- Security definer helper functions
CREATE OR REPLACE FUNCTION public.is_admin_plataforma()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND papel = 'admin_plataforma' AND status = 'ativo');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_lab()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND papel = 'admin_lab' AND status = 'ativo');
$$;

CREATE OR REPLACE FUNCTION public.my_escola_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT escola_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Enable RLS
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos_laboratorio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- escolas
CREATE POLICY "escolas_admin_plataforma_all" ON public.escolas FOR ALL TO authenticated USING (public.is_admin_plataforma()) WITH CHECK (public.is_admin_plataforma());
CREATE POLICY "escolas_users_select_own" ON public.escolas FOR SELECT TO authenticated USING (id = public.my_escola_id());

-- profiles
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND papel = (SELECT papel FROM public.profiles WHERE id = auth.uid()) AND status = (SELECT status FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "profiles_admin_plat_all" ON public.profiles FOR ALL TO authenticated USING (public.is_admin_plataforma()) WITH CHECK (public.is_admin_plataforma());
CREATE POLICY "profiles_admin_lab_select" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin_lab() AND escola_id = public.my_escola_id());
CREATE POLICY "profiles_admin_lab_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin_lab() AND escola_id = public.my_escola_id() AND papel = 'professor');
CREATE POLICY "profiles_admin_lab_update" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin_lab() AND escola_id = public.my_escola_id() AND papel = 'professor') WITH CHECK (public.is_admin_lab() AND escola_id = public.my_escola_id() AND papel = 'professor');
CREATE POLICY "profiles_admin_lab_delete" ON public.profiles FOR DELETE TO authenticated USING (public.is_admin_lab() AND escola_id = public.my_escola_id() AND papel = 'professor');
CREATE POLICY "profiles_same_school_select" ON public.profiles FOR SELECT TO authenticated USING (escola_id IS NOT NULL AND escola_id = public.my_escola_id());

-- recursos
CREATE POLICY "recursos_admin_plat_all" ON public.recursos FOR ALL TO authenticated USING (public.is_admin_plataforma()) WITH CHECK (public.is_admin_plataforma());
CREATE POLICY "recursos_admin_lab_all" ON public.recursos FOR ALL TO authenticated USING (public.is_admin_lab() AND escola_id = public.my_escola_id()) WITH CHECK (public.is_admin_lab() AND escola_id = public.my_escola_id());
CREATE POLICY "recursos_school_select" ON public.recursos FOR SELECT TO authenticated USING (escola_id = public.my_escola_id());

-- reservas
CREATE POLICY "reservas_admin_plat_all" ON public.reservas FOR ALL TO authenticated USING (public.is_admin_plataforma()) WITH CHECK (public.is_admin_plataforma());
CREATE POLICY "reservas_admin_lab_all" ON public.reservas FOR ALL TO authenticated USING (public.is_admin_lab() AND escola_id = public.my_escola_id()) WITH CHECK (public.is_admin_lab() AND escola_id = public.my_escola_id());
CREATE POLICY "reservas_school_select" ON public.reservas FOR SELECT TO authenticated USING (escola_id = public.my_escola_id());
CREATE POLICY "reservas_prof_insert" ON public.reservas FOR INSERT TO authenticated WITH CHECK (escola_id = public.my_escola_id() AND profile_id = auth.uid() AND status = 'confirmada');
CREATE POLICY "reservas_prof_update" ON public.reservas FOR UPDATE TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid() AND escola_id = public.my_escola_id());
CREATE POLICY "reservas_prof_delete" ON public.reservas FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- avisos_laboratorio
CREATE POLICY "avisos_admin_plat_all" ON public.avisos_laboratorio FOR ALL TO authenticated USING (public.is_admin_plataforma()) WITH CHECK (public.is_admin_plataforma());
CREATE POLICY "avisos_admin_lab_all" ON public.avisos_laboratorio FOR ALL TO authenticated USING (public.is_admin_lab() AND escola_id = public.my_escola_id()) WITH CHECK (public.is_admin_lab() AND escola_id = public.my_escola_id());
CREATE POLICY "avisos_school_select" ON public.avisos_laboratorio FOR SELECT TO authenticated USING (escola_id = public.my_escola_id());

-- logs_auditoria
CREATE POLICY "logs_admin_plat_all" ON public.logs_auditoria FOR ALL TO authenticated USING (public.is_admin_plataforma()) WITH CHECK (public.is_admin_plataforma());
CREATE POLICY "logs_admin_lab_select" ON public.logs_auditoria FOR SELECT TO authenticated USING (public.is_admin_lab() AND escola_id = public.my_escola_id());
CREATE POLICY "logs_self_insert" ON public.logs_auditoria FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
