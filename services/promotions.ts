import { supabase } from '@/lib/supabase';

export type PromoScope = 'general' | 'product' | 'category' | 'combo';
export type DiscountType = 'none' | 'percentage' | 'fixed';

export interface CreatePromotionInput {
    businessId: string;
    createdBy: string;
    scope: PromoScope;
    title: string;
    description?: string;
    discountType?: DiscountType;
    discountValue?: number;
    startAt: string; // ISO string
    endAt: string; // ISO string
    paymentReference?: string;
    paymentNote?: string;
}

function generateId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export async function createPromotion(input: CreatePromotionInput) {
    const id = generateId();

    const { data, error } = await supabase
        .from('promotions')
        .insert({
            id_prm: id,
            business_id_prm: input.businessId,
            created_by_prm: input.createdBy,
            scope_prm: input.scope,
            title_prm: input.title,
            description_prm: input.description ?? null,
            discount_type_prm: input.discountType ?? 'percentage',
            discount_value_prm: input.discountValue ?? 0,
            start_at_prm: input.startAt,
            end_at_prm: input.endAt,
            payment_reference_prm: input.paymentReference ?? null,
            payment_note_prm: input.paymentNote ?? null,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function linkPromotionProduct(promotionId: string, productId: string) {
    const { error } = await supabase
        .from('promotion_products')
        .insert({ promotion_id_ppr: promotionId, product_id_ppr: productId });

    if (error) throw error;
    return true;
}

export async function getProductsByBusiness(businessId: string) {
    const { data, error } = await supabase
        .from('products')
        .select('id_prd, name_prd, price_prd, currency_prd')
        .eq('business_id_prd', businessId)
        .eq('is_active_prd', true)
        .order('created_at_prd', { ascending: false });

    if (error) throw error;
    return data ?? [];
}
