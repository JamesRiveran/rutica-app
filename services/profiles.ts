import { supabase } from '@/lib/supabase';

export async function getMyProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserRole(userId: string, role: 'buyer' | 'seller' | 'admin') {
  const { error } = await supabase
    .from('profiles')
    .update({ role_prf: role })
    .eq('id_prf', userId);

  if (error) throw error;
}
