-- Update status check constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT profiles_status_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status = ANY (ARRAY['ativo'::text, 'pendente'::text, 'bloqueado'::text, 'removido'::text]));

-- Ensure RLS policies are correct for Admin Lab
-- They already have:
-- cmd: UPDATE qual: (is_admin_lab() AND (escola_id = my_escola_id()) AND (papel = 'professor'::text))
-- This allows them to set status = 'removido'.

-- The user also mentioned that Admin Lab should NOT be able to create or delete Admin Lab accounts.
-- Current policy:
-- profiles_admin_lab_insert: is_admin_lab() AND (escola_id = my_escola_id()) AND (papel = 'professor'::text)
-- profiles_admin_lab_delete: is_admin_lab() AND (escola_id = my_escola_id()) AND (papel = 'professor'::text)
-- This is already correct (only allows 'professor' papel).
