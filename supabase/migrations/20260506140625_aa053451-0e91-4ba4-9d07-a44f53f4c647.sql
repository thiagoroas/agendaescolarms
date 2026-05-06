REVOKE EXECUTE ON FUNCTION public.has_school_link(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_school_link(uuid, text) TO authenticated;