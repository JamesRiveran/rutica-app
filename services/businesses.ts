import { supabase } from '@/lib/supabase';

export interface CreateBusinessInput {
  ownerId: string;

  // Business
  name: string;
  description?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  website?: string;

  // Location
  country?: string;
  province?: string;
  canton?: string;
  district?: string;
  address?: string;
  latitude: number;
  longitude: number;
}


export async function createBusiness(input: CreateBusinessInput) {
  // 1️⃣ Crear ubicación
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .insert({
      country_loc: input.country ?? null,
      province_loc: input.province ?? null,
      canton_loc: input.canton ?? null,
      district_loc: input.district ?? null,
      address_loc: input.address ?? null,
      latitude_loc: input.latitude,
      longitude_loc: input.longitude,
    })
    .select()
    .single();

  if (locationError) throw locationError;

  // 2️⃣ Crear comercio
  const { error: businessError } = await supabase
    .from('businesses')
    .insert({
      owner_id_bus: input.ownerId,
      name_bus: input.name,
      description_bus: input.description ?? null,
      location_id_bus: location.id_loc,

      whatsapp_phone_bus: input.whatsapp ?? null,
      contact_phone_bus: input.phone ?? null,
      contact_email_bus: input.email ?? null,
      website_bus: input.website ?? null,

      moderation_status_bus: 'pending',
    });

  if (businessError) throw businessError;
}
