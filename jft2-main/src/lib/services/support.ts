import { createClient } from '@/lib/supabase/server';
import type { Faq, SupportMessage, SupportTicket } from '@/lib/types/database';

export async function getMyTickets(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SupportTicket[];
}

export async function getTicketWithMessages(ticketId: string) {
  const supabase = await createClient();
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();
  if (!ticket) return null;
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  return {
    ticket: ticket as SupportTicket,
    messages: (messages ?? []) as SupportMessage[],
  };
}

export async function listAllTickets(limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SupportTicket[];
}

export async function listPublishedFaqs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('status', 'published')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Faq[];
}

export async function listAllFaqs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Faq[];
}
