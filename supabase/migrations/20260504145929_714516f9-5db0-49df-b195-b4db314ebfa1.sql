CREATE OR REPLACE FUNCTION public.admin_delete_escola_teste(p_escola_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin_plataforma BOOLEAN;
    v_reservas_count INTEGER;
    v_avisos_count INTEGER;
    v_horarios_count INTEGER;
    v_recursos_count INTEGER;
    v_profiles_count INTEGER;
    v_escola_count INTEGER;
BEGIN
    -- 1. Validar se o usuário logado é admin_plataforma
    SELECT (papel = 'admin_plataforma') INTO v_is_admin_plataforma
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_is_admin_plataforma IS NOT TRUE THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores da plataforma podem realizar esta ação.';
    END IF;

    -- 2. Limpeza em ordem segura
    -- Reservas
    DELETE FROM public.reservas WHERE escola_id = p_escola_id;
    GET DIAGNOSTICS v_reservas_count = ROW_COUNT;

    -- Avisos
    DELETE FROM public.avisos_laboratorio WHERE escola_id = p_escola_id;
    GET DIAGNOSTICS v_avisos_count = ROW_COUNT;

    -- Horários
    DELETE FROM public.horarios_escola WHERE escola_id = p_escola_id;
    GET DIAGNOSTICS v_horarios_count = ROW_COUNT;

    -- Recursos
    DELETE FROM public.recursos WHERE escola_id = p_escola_id;
    GET DIAGNOSTICS v_recursos_count = ROW_COUNT;

    -- Perfis (exceto admin_plataforma para não apagar o próprio usuário ou outros admins)
    DELETE FROM public.profiles 
    WHERE escola_id = p_escola_id 
    AND papel <> 'admin_plataforma';
    GET DIAGNOSTICS v_profiles_count = ROW_COUNT;

    -- Logs de Auditoria (se existirem e tiverem escola_id)
    DELETE FROM public.logs_auditoria WHERE escola_id = p_escola_id;

    -- Finalmente, a Escola
    DELETE FROM public.escolas WHERE id = p_escola_id;
    GET DIAGNOSTICS v_escola_count = ROW_COUNT;

    -- Retornar resultado
    RETURN jsonb_build_object(
        'ok', true,
        'reservas_deleted', v_reservas_count,
        'avisos_deleted', v_avisos_count,
        'horarios_deleted', v_horarios_count,
        'recursos_deleted', v_recursos_count,
        'profiles_deleted', v_profiles_count,
        'escola_deleted', v_escola_count
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'ok', false,
        'error', SQLERRM,
        'detail', SQLSTATE
    );
END;
$$;