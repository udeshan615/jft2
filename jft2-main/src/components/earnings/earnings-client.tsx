'use client';

import { formatLkr, formatDateTime, friendlyError } from '@/lib/utils/format';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet,
  ArrowDownToLine,
  CreditCard,
  History,
  Gamepad2,
  Plus,
  Trash2,
  Star,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils/cn';
import type {
  Wallet as WalletType,
  Transaction,
  PaymentMethod,
  WithdrawalRequest,
  DailyGame,
} from '@/lib/types/database';

interface Props {
  userId: string;
  wallet: WalletType | null;
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  withdrawals: WithdrawalRequest[];
  settings: Record<string, unknown>;
  currentGame: DailyGame | null;
}

function formatLkr(n: number) {
  return `LKR ${Number(n).toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function parseSetting(v: unknown, fallback: string): string {
  if (v === null || v === undefined) return fallback;
  const s = String(v).replace(/^"|"$/g, '');
  return s || fallback;
}

export function EarningsClient({
  userId,
  wallet,
  transactions,
  paymentMethods: initialPMs,
  withdrawals: initialWDs,
  settings,
  currentGame,
}: Props) {
  const router = useRouter();
  const [pms, setPms] = useState(initialPMs);
  const [wds] = useState(initialWDs);
  const [showAddPM, setShowAddPM] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [pmType, setPmType] = useState<'bank' | 'mobile_money'>('bank');
  const [pmForm, setPmForm] = useState({
    account_name: '',
    bank_name: '',
    branch: '',
    account_number: '',
    phone_number: '',
    label: '',
  });
  const [wdAmount, setWdAmount] = useState('');
  const [wdPmId, setWdPmId] = useState(initialPMs.find((p) => p.is_default)?.id || initialPMs[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const submitting = useRef(false);

  const balance = Number(wallet?.balance_lkr ?? 0);
  const pending = Number(wallet?.pending_lkr ?? 0);
  const earned = Number(wallet?.lifetime_earned_lkr ?? 0);
  const withdrawn = Number(wallet?.lifetime_withdrawn_lkr ?? 0);

  const minWd = Number(parseSetting(settings.min_withdrawal_amount, '500'));
  const maxWd = Number(parseSetting(settings.max_withdrawal_amount, '0'));
  const bankEnabled =
    parseSetting(settings.payment_bank_enabled, 'true') === 'true';
  const mobileEnabled =
    parseSetting(settings.payment_mobile_enabled, 'true') === 'true';

  async function savePaymentMethod() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const payload: Record<string, unknown> = {
      user_id: userId,
      type: pmType,
      label: pmForm.label || (pmType === 'bank' ? pmForm.bank_name : 'Mobile money'),
      is_default: pms.length === 0,
    };
    if (pmType === 'bank') {
      if (!pmForm.account_name || !pmForm.bank_name || !pmForm.account_number) {
        setError('Please fill account name, bank, and account number');
        setLoading(false);
        return;
      }
      payload.account_name = pmForm.account_name;
      payload.bank_name = pmForm.bank_name;
      payload.branch = pmForm.branch || null;
      payload.account_number = pmForm.account_number;
    } else {
      if (!pmForm.phone_number) {
        setError('Phone number required');
        setLoading(false);
        return;
      }
      payload.phone_number = pmForm.phone_number;
      payload.account_name = pmForm.account_name || null;
    }

    const { data, error: err } = await supabase
      .from('payment_methods')
      .insert(payload)
      .select('*')
      .single();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setPms((prev) => [data as PaymentMethod, ...prev]);
    setShowAddPM(false);
    setPmForm({
      account_name: '',
      bank_name: '',
      branch: '',
      account_number: '',
      phone_number: '',
      label: '',
    });
    setMsg('Payment method added');
    setLoading(false);
    router.refresh();
  }

  async function deletePM(id: string) {
    if (!confirm('Remove this payment method?')) return;
    const supabase = createClient();
    await supabase.from('payment_methods').delete().eq('id', id);
    setPms((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  async function setDefaultPM(id: string) {
    const supabase = createClient();
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);
    await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', id);
    setPms((prev) =>
      prev.map((p) => ({ ...p, is_default: p.id === id }))
    );
  }

  async function submitWithdrawal() {
    if (submitting.current) return;
    setError(null);
    const amount = Number(wdAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (amount > balance) {
      setError('Amount exceeds available balance');
      return;
    }
    if (amount < minWd) {
      setError(`Minimum withdrawal is ${formatLkr(minWd)}`);
      return;
    }
    if (maxWd > 0 && amount > maxWd) {
      setError(`Maximum withdrawal is ${formatLkr(maxWd)}`);
      return;
    }
    if (!wdPmId) {
      setError('Select a payment method');
      return;
    }

    submitting.current = true;
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.rpc('create_withdrawal_request', {
      p_amount: amount,
      p_payment_method_id: wdPmId,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      submitting.current = false;
      return;
    }

    setShowWithdraw(false);
    setWdAmount('');
    setMsg('Withdrawal request submitted');
    setLoading(false);
    submitting.current = false;
    router.refresh();
  }

  const gameState = (() => {
    if (!currentGame || !currentGame.is_enabled) return 'none';
    const now = Date.now();
    const s = new Date(currentGame.starts_at).getTime();
    const e = new Date(currentGame.ends_at).getTime();
    if (now < s) return 'upcoming';
    if (now > e) return 'ended';
    return 'live';
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">Balance, withdrawals & daily game</p>
      </div>

      {(msg || error) && (
        <p
          className={cn(
            'rounded-xl px-4 py-2 text-center text-sm',
            error ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
          )}
        >
          {error || msg}
        </p>
      )}

      {/* Balance */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" /> Available balance
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {formatLkr(balance)}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-card/80 px-2 py-2">
              <p className="text-[10px] uppercase text-muted-foreground">Pending</p>
              <p className="text-sm font-medium">{formatLkr(pending)}</p>
            </div>
            <div className="rounded-xl bg-card/80 px-2 py-2">
              <p className="text-[10px] uppercase text-muted-foreground">Earned</p>
              <p className="text-sm font-medium">{formatLkr(earned)}</p>
            </div>
            <div className="rounded-xl bg-card/80 px-2 py-2">
              <p className="text-[10px] uppercase text-muted-foreground">Withdrawn</p>
              <p className="text-sm font-medium">{formatLkr(withdrawn)}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              className="flex-1 gap-2"
              onClick={() => {
                setError(null);
                if (pms.length === 0) {
                  setShowAddPM(true);
                  setMsg('Add a payment method first');
                  return;
                }
                setShowWithdraw(true);
              }}
            >
              <ArrowDownToLine className="h-4 w-4" /> Withdraw
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => setShowAddPM(true)}
            >
              <Plus className="h-4 w-4" /> Payment method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Earning methods */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Earn more</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Link href={currentGame ? `/daily-game?id=${currentGame.id}` : '/daily-game'}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Daily Game</p>
                  <p className="text-xs text-muted-foreground">
                    {gameState === 'live'
                      ? 'Live now — play & win'
                      : gameState === 'upcoming'
                        ? 'Coming soon'
                        : gameState === 'ended'
                          ? 'See results'
                          : 'Check schedule'}
                  </p>
                </div>
                {gameState === 'live' && <Badge variant="success">LIVE</Badge>}
              </CardContent>
            </Card>
          </Link>
          <Card className="opacity-80">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">More methods</p>
                <p className="text-xs text-muted-foreground">Coming in later phases</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment methods */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Payment methods</CardTitle>
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowAddPM(true)}>
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {pms.length === 0 && (
            <EmptyState
              title="No payment methods"
              description="Add a bank account or mobile number to withdraw"
              className="py-8"
            />
          )}
          {pms.map((pm) => (
            <div
              key={pm.id}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {pm.label || pm.bank_name || pm.phone_number || 'Method'}
                  </span>
                  {pm.is_default && <Badge variant="secondary">Default</Badge>}
                  <Badge variant="outline">{pm.type}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pm.type === 'bank'
                    ? `${pm.account_name || ''} ·••${(pm.account_number || '').slice(-4)}`
                    : pm.phone_number}
                </p>
              </div>
              <div className="flex gap-1">
                {!pm.is_default && (
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    title="Set default"
                    onClick={() => setDefaultPM(pm.id)}
                  >
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => deletePM(pm.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Withdrawals */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Withdrawal history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {wds.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No withdrawals yet
            </p>
          )}
          {wds.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-3"
            >
              <div>
                <p className="text-sm font-medium">{formatLkr(Number(w.amount_lkr))}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(w.created_at).toLocaleString()}
                </p>
                {w.admin_notes && w.status === 'rejected' && (
                  <p className="text-xs text-destructive">{w.admin_notes}</p>
                )}
              </div>
              <Badge
                variant={
                  w.status === 'paid'
                    ? 'success'
                    : w.status === 'rejected' || w.status === 'cancelled'
                      ? 'destructive'
                      : w.status === 'pending'
                        ? 'warning'
                        : 'secondary'
                }
              >
                {w.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Transactions</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {transactions.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No transactions yet
            </p>
          )}
          {transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium">
                  {t.description || t.type}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.created_at).toLocaleString()} · {t.type}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-sm font-medium',
                    t.type === 'withdrawal' || t.type === 'debit'
                      ? 'text-destructive'
                      : 'text-success'
                  )}
                >
                  {t.type === 'withdrawal' || t.type === 'debit' ? '−' : '+'}
                  {formatLkr(Number(t.amount_lkr))}
                </p>
                <Badge variant="outline" className="text-[10px]">
                  {t.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Add PM modal */}
      <Modal
        open={showAddPM}
        onClose={() => setShowAddPM(false)}
        title="Add payment method"
        size="md"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={pmType}
              onChange={(e) =>
                setPmType(e.target.value as 'bank' | 'mobile_money')
              }
            >
              {bankEnabled && <option value="bank">Bank account</option>}
              {mobileEnabled && (
                <option value="mobile_money">Phone / mobile money</option>
              )}
            </Select>
          </div>
          {pmType === 'bank' ? (
            <>
              <div className="space-y-2">
                <Label>Account holder name</Label>
                <Input
                  value={pmForm.account_name}
                  onChange={(e) =>
                    setPmForm({ ...pmForm, account_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Bank name</Label>
                <Input
                  value={pmForm.bank_name}
                  onChange={(e) =>
                    setPmForm({ ...pmForm, bank_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Branch (optional)</Label>
                <Input
                  value={pmForm.branch}
                  onChange={(e) =>
                    setPmForm({ ...pmForm, branch: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Account number</Label>
                <Input
                  value={pmForm.account_number}
                  onChange={(e) =>
                    setPmForm({ ...pmForm, account_number: e.target.value })
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Phone number</Label>
                <Input
                  value={pmForm.phone_number}
                  onChange={(e) =>
                    setPmForm({ ...pmForm, phone_number: e.target.value })
                  }
                  placeholder="+94..."
                />
              </div>
              <div className="space-y-2">
                <Label>Name (optional)</Label>
                <Input
                  value={pmForm.account_name}
                  onChange={(e) =>
                    setPmForm({ ...pmForm, account_name: e.target.value })
                  }
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label>Label (optional)</Label>
            <Input
              value={pmForm.label}
              onChange={(e) =>
                setPmForm({ ...pmForm, label: e.target.value })
              }
              placeholder="My HNB account"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={savePaymentMethod} disabled={loading}>
            {loading ? <Spinner size="sm" /> : 'Save'}
          </Button>
        </div>
      </Modal>

      {/* Withdraw modal */}
      <Modal
        open={showWithdraw}
        onClose={() => setShowWithdraw(false)}
        title="Request withdrawal"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Available: <strong>{formatLkr(balance)}</strong> · Min: {formatLkr(minWd)}
            {maxWd > 0 ? ` · Max: ${formatLkr(maxWd)}` : ''}
          </p>
          <div className="space-y-2">
            <Label>Amount (LKR)</Label>
            <Input
              type="number"
              min={minWd}
              step="0.01"
              value={wdAmount}
              onChange={(e) => setWdAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={wdPmId}
              onChange={(e) => setWdPmId(e.target.value)}
            >
              {pms.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.label || pm.bank_name || pm.phone_number} ({pm.type})
                </option>
              ))}
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            className="w-full"
            onClick={submitWithdrawal}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : 'Confirm withdrawal'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
