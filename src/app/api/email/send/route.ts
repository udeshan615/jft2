import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendSystemEmail, isEmailEnabled } from '@/lib/services/email';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const type = body.type as string;
    const targetUserId = (body.userId as string) || user.id;
    const meta = (body.meta || {}) as Record<string, string>;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email, display_name')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.role === 'admin';
    if (!isAdmin && targetUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: target } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', targetUserId)
      .maybeSingle();

    if (!target?.email) {
      return NextResponse.json({ error: 'No email' }, { status: 400 });
    }

    const placeholders: Record<string, string> = {
      name: target.display_name || 'User',
      email: target.email,
      date: new Date().toLocaleString('en-LK'),
      status: meta.status || 'pending',
      amount: meta.amount || '',
      fee: meta.fee || '0',
      total: meta.total || meta.amount || '',
      payment_method: meta.payment_method || '',
      ...meta,
    };

    if (type === 'verification_success') {
      if (!(await isEmailEnabled('verification_email_enabled'))) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      const result = await sendSystemEmail({
        to: target.email,
        templateKey: 'verification_success',
        placeholders,
      });
      return NextResponse.json(result);
    }

    if (type === 'withdrawal_confirmation') {
      if (!(await isEmailEnabled('withdrawal_email_enabled'))) {
        return NextResponse.json({ ok: true, skipped: true });
      }
      const result = await sendSystemEmail({
        to: target.email,
        templateKey: 'withdrawal_confirmation',
        placeholders,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
