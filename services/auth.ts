import { supabase } from '@/lib/supabase';

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  role: 'buyer' | 'seller'
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name_prf: fullName,
        phone_number_prf: phone,
        role_prf: role,
      },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('User not created');

  return data.user;
}
