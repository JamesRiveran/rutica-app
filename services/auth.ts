import { supabase } from '@/lib/supabase';

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  role: 'buyer' | 'seller'
) {
  // 1. Crear usuario en auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error('User not created');

  // 2. Crear perfil manualmente
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id_prf: data.user.id,
      full_name_prf: fullName,
      phone_number_prf: phone || null,
      role_prf: role,
      is_active_prf: true,
    });

  if (profileError) {
    console.error('Error creando perfil:', profileError);
    throw new Error('Error al crear el perfil: ' + profileError.message);
  }

  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data.session;
}
