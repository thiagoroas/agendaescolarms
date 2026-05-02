import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Verifica se o Supabase está configurado corretamente
// Considera configurado se as variáveis existirem E não forem os valores de placeholder
export const isSupabaseConfigured = Boolean(supabaseUrl) && 
  Boolean(supabaseAnonKey) && 
  supabaseUrl !== 'https://placeholder-url.supabase.co';

if (import.meta.env.DEV) {
  console.log("Supabase configurado?", isSupabaseConfigured);
}
