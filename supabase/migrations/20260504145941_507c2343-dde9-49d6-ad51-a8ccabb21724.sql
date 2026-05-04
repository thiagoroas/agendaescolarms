-- Revogar acesso público à função
REVOKE EXECUTE ON FUNCTION public.admin_delete_escola_teste(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_escola_teste(UUID) FROM anon;

-- Conceder acesso apenas a usuários autenticados
-- A própria função valida internamente se o papel é 'admin_plataforma'
GRANT EXECUTE ON FUNCTION public.admin_delete_escola_teste(UUID) TO authenticated;