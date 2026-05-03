-- Garantir que as colunas existam
ALTER TABLE public.reservas 
ADD COLUMN IF NOT EXISTS turno TEXT;

ALTER TABLE public.reservas 
ADD COLUMN IF NOT EXISTS aviso_confirmado_em TIMESTAMPTZ;

ALTER TABLE public.reservas 
ADD COLUMN IF NOT EXISTS aviso_confirmado_id UUID;

-- Recarregar schema cache
NOTIFY pgrst, 'reload schema';