import { createClient } from '@/lib/supabase/server';
import type {
  Wallet,
  Transaction,
  PaymentMethod,
  WithdrawalRequest,
} from '@/lib/types/database';

export async function getUserWallet(userId: string): Promise<Wallet | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return (data as Wallet) ?? null;
}

export async function getUserTransactions(
  userId: string,
  limit = 30,
  offset = 0
): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return [];
  return (data as Transaction[]) ?? [];
}

export async function getUserPaymentMethods(
  userId: string
): Promise<PaymentMethod[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return (data as PaymentMethod[]) ?? [];
}

export async function getUserWithdrawals(
  userId: string
): Promise<WithdrawalRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data as WithdrawalRequest[]) ?? [];
}

export async function getPendingWithdrawalsAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('withdrawal_requests')
    .select(
      `
      *,
      profiles:user_id ( id, display_name, email ),
      payment_methods:payment_method_id ( id, type, label, account_name, account_number, bank_name, phone_number )
    `
    )
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}
