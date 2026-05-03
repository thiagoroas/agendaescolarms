ALTER TABLE public.reservas 
ADD COLUMN IF NOT EXISTS aviso_confirmado_id UUID,
ADD COLUMN IF NOT EXISTS aviso_confirmado_em TIMESTAMPTZ;

-- Recarrega o cache do PostgREST para reconhecer as novas colunas imediatamente
NOTIFY pgrst, 'reload schema';