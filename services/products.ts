import { supabase } from '@/lib/supabase';

export interface CreateProductInput {
    businessId: string;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    productCategoryId?: string;
}

export interface CreateProductCategoryInput {
    name: string;
}

export async function getProductCategories() {
    const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name_pca', { ascending: true });

    if (error) throw error;
    return data;
}

export async function createProductCategory(input: CreateProductCategoryInput) {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });

    const { error, data } = await supabase
        .from('product_categories')
        .insert({
            id_pca: id,
            name_pca: input.name,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function createProduct(input: CreateProductInput) {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });

    // Crear el producto
    const { error: productError, data: productData } = await supabase
        .from('products')
        .insert({
            id_prd: id,
            business_id_prd: input.businessId,
            name_prd: input.name,
            description_prd: input.description ?? null,
            price_prd: input.price,
            currency_prd: input.currency ?? 'CRC',
            is_active_prd: true,
        })
        .select()
        .single();

    if (productError) throw productError;

    // Mapear la categoría si existe
    if (input.productCategoryId) {
        const { error: mapError } = await supabase
            .from('product_category_map')
            .insert({
                product_id_pcm: id,
                category_id_pcm: input.productCategoryId,
            });

        if (mapError) throw mapError;
    }

    return productData;
}

export async function uploadProductImage(file: any, productId: string) {
    const filename = `${productId}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const { error } = await supabase.storage
        .from('product-images')
        .upload(filename, file);

    if (error) throw error;
    return filename;
}

export async function saveProductImage(productId: string, path: string) {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });

    console.log('[SAVE IMAGE] Attempting to save:', {
        id_pim: id,
        product_id_pim: productId,
        path_pim: path,
        bucket_pim: 'product-images',
        sort_order_pim: 0,
    });

    const { error, data } = await supabase
        .from('product_images')
        .insert({
            id_pim: id,
            product_id_pim: productId,
            path_pim: path,
            bucket_pim: 'product-images',
            sort_order_pim: 0,
        })
        .select()
        .single();

    if (error) {
        console.error('[SAVE IMAGE ERROR]', JSON.stringify(error, null, 2));
        throw error;
    }
    console.log('[SAVE IMAGE SUCCESS]', data);
    return data;
}

export async function getMyBusinesses(userId: string) {
    const { data, error } = await supabase
        .from('businesses')
        .select('id_bus, name_bus')
        .eq('owner_id_bus', userId)
        .eq('is_active_bus', true)
        .order('created_at_bus', { ascending: false });

    if (error) throw error;
    return data;
}

export async function getProductsByBusinessId(businessId: string) {
    const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            product_images (*)
        `)
        .eq('business_id_prd', businessId)
        .order('created_at_prd', { ascending: false });

    if (error) throw error;
    return data;
}
