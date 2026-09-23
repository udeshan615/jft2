import { createClient } from '@/lib/supabase/server';
import type {
  Product,
  ProductAccess,
  ProductOrder,
  ReferralCommission,
} from '@/lib/types/database';

export async function listPublishedProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published')
    .eq('is_available', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function listAllProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProduct(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export async function getUserAccess(userId: string, productId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('product_access')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .eq('status', 'active')
    .maybeSingle();
  return data as ProductAccess | null;
}

export async function getMyPurchases(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_orders')
    .select('*, product:products(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProductOrder[];
}

export async function getMyAccess(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_access')
    .select('*, product:products(*)')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (error) throw error;
  return (data ?? []) as ProductAccess[];
}

export async function createOrder(productId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_product_order', {
    p_product_id: productId,
  });
  if (error) throw error;
  return data as string;
}

export async function listOrders(limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('product_orders')
    .select('*, product:products(title, price_lkr), profiles:profiles!product_orders_user_id_fkey(display_name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listCommissions(opts?: { status?: string; limit?: number }) {
  const supabase = await createClient();
  let q = supabase
    .from('referral_commissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts?.limit ?? 50);
  if (opts?.status) q = q.eq('status', opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ReferralCommission[];
}

export async function getMyCommissions(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('referral_commissions')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReferralCommission[];
}

export async function getCommissionStats(userId: string) {
  const list = await getMyCommissions(userId);
  let total = 0;
  let pending = 0;
  let paid = 0;
  for (const c of list) {
    if (c.status === 'paid') {
      paid += Number(c.amount_lkr) || 0;
      total += Number(c.amount_lkr) || 0;
    } else if (c.status === 'pending' || c.status === 'approved') {
      pending += Number(c.amount_lkr) || 0;
    }
  }
  return { total, pending, paid, count: list.length };
}
