'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  ExternalLink,
  Upload,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ImageIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SectionIntroModal } from '@/components/ui/section-intro-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils/cn';
import type {
  VerificationTask,
  VerificationSubmission,
  VerificationStatus,
} from '@/lib/types/database';

interface VerificationClientProps {
  userId: string;
  overallStatus: VerificationStatus;
  tasks: VerificationTask[];
  submissions: VerificationSubmission[];
  referralCount: number;
  introSeen: boolean;
}

type UploadState = 'idle' | 'uploading' | 'checking' | 'done' | 'error';

export function VerificationClient({
  userId,
  overallStatus,
  tasks,
  submissions,
  referralCount,
  introSeen: initialIntroSeen,
}: VerificationClientProps) {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(!initialIntroSeen);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>(
    {}
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Server-side auto-approve: call DB function so pending WhatsApp proofs
  // become approved after the configured delay (default 10 minutes).
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const supabase = createClient();
      await supabase.rpc('run_due_auto_approvals');
      await supabase.rpc('try_auto_complete_referral_task', { p_user_id: userId });
      if (!cancelled) router.refresh();
    }
    tick();
    const id = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [userId, router]);

  // Fire verification success email once when status becomes verified
  useEffect(() => {
    if (overallStatus !== 'verified') return;
    const key = `verification_email_sent_${userId}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) return;
    fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'verification_success', userId }),
    })
      .then(() => {
        try {
          sessionStorage.setItem(key, '1');
        } catch {
          /* ignore */
        }
      })
      .catch(() => {});
  }, [overallStatus, userId]);

  async function markIntroSeen() {
    setShowIntro(false);
    const supabase = createClient();
    await supabase
      .from('user_preferences')
      .upsert(
        { user_id: userId, verification_intro_seen: true },
        { onConflict: 'user_id' }
      );
  }

  function getSubmission(taskId: string) {
    return submissions.find((s) => s.task_id === taskId);
  }

  function getReferralProgress(task: VerificationTask) {
    const min =
      typeof task.requirements?.min_referrals === 'number'
        ? task.requirements.min_referrals
        : Number(task.requirements?.min_referrals) || 2;
    return { current: referralCount, required: min };
  }

  async function handleScreenshotSubmit(task: VerificationTask, file: File) {
    const taskId = task.id;
    setErrors((e) => ({ ...e, [taskId]: '' }));

    if (!file.type.startsWith('image/')) {
      setErrors((e) => ({ ...e, [taskId]: 'Please upload an image file.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({
        ...e,
        [taskId]: 'Image must be under 5 MB.',
      }));
      return;
    }

    setUploadStates((s) => ({ ...s, [taskId]: 'uploading' }));
    const supabase = createClient();

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${userId}/${taskId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('verification')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setUploadStates((s) => ({ ...s, [taskId]: 'error' }));
      setErrors((e) => ({
        ...e,
        [taskId]: uploadError.message || 'Upload failed',
      }));
      return;
    }

    // Store path (private bucket – signed URL for admin later)
    const proofPath = path;

    const existing = getSubmission(taskId);
    if (existing) {
      const { error } = await supabase
        .from('verification_submissions')
        .update({
          proof_url: proofPath,
          status: 'pending',
          proof_metadata: { filename: file.name, size: file.size },
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (error) {
        setUploadStates((s) => ({ ...s, [taskId]: 'error' }));
        setErrors((e) => ({ ...e, [taskId]: error.message }));
        return;
      }
    } else {
      const { error } = await supabase.from('verification_submissions').insert({
        user_id: userId,
        task_id: taskId,
        status: 'pending',
        proof_url: proofPath,
        proof_metadata: { filename: file.name, size: file.size },
      });
      if (error) {
        setUploadStates((s) => ({ ...s, [taskId]: 'error' }));
        setErrors((e) => ({ ...e, [taskId]: error.message }));
        return;
      }
    }

    // Brief "checking" UX then pending
    setUploadStates((s) => ({ ...s, [taskId]: 'checking' }));
    await new Promise((r) => setTimeout(r, 1200));
    setUploadStates((s) => ({ ...s, [taskId]: 'done' }));
    router.refresh();
  }

  async function tryCompleteReferralTask(task: VerificationTask) {
    const { current, required } = getReferralProgress(task);
    if (current < required) return;

    const existing = getSubmission(task.id);
    if (existing?.status === 'approved') return;

    const supabase = createClient();
    // Server-side auto-complete when 2 valid referrals are reached
    await supabase.rpc('try_auto_complete_referral_task', { p_user_id: userId });
    router.refresh();
  }

  return (
    <>
      <SectionIntroModal
        open={showIntro}
        onClose={() => markIntroSeen()}
        onNext={() => markIntroSeen()}
        title="Account Verification"
        description="Verification keeps the community fair. Complete the tasks below — join our WhatsApp channel and invite friends. Once all required tasks are approved, your account becomes verified and you unlock full rewards."
        icon={<BadgeCheck className="h-7 w-7" />}
        nextLabel="Got it"
      />

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Verification
            </h1>
            <p className="text-sm text-muted-foreground">
              Complete all required tasks to get verified
            </p>
          </div>
          <Badge
            variant={
              overallStatus === 'verified'
                ? 'success'
                : overallStatus === 'pending'
                  ? 'warning'
                  : 'muted'
            }
          >
            {overallStatus}
          </Badge>
        </div>

        {tasks.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No verification tasks are configured yet. Please check back later.
            </CardContent>
          </Card>
        )}

        {tasks.map((task, idx) => {
          const sub = getSubmission(task.id);
          const state = uploadStates[task.id] || 'idle';
          const isWhatsApp =
            task.task_type === 'whatsapp_join' ||
            task.task_type === 'screenshot_upload';
          const isReferral = task.task_type === 'referral_count';
          const whatsappUrl =
            (task.requirements?.whatsapp_url as string) || '';

          return (
            <Card key={task.id} className="overflow-hidden animate-slide-up">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Task {idx + 1}
                      {task.is_required ? ' · Required' : ''}
                    </p>
                    <CardTitle className="mt-1 text-base">{task.title}</CardTitle>
                  </div>
                  {sub?.status === 'approved' && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </Badge>
                  )}
                  {sub?.status === 'pending' && (
                    <Badge variant="warning" className="gap-1">
                      <Clock className="h-3 w-3" /> Pending
                    </Badge>
                  )}
                  {sub?.status === 'rejected' && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" /> Rejected
                    </Badge>
                  )}
                </div>
                {task.description && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {task.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isWhatsApp && (
                  <>
                    {whatsappUrl ? (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex"
                      >
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Open WhatsApp
                        </Button>
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        WhatsApp link will appear once the admin configures it.
                      </p>
                    )}

                    {sub?.status !== 'approved' && (
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => {
                            fileRefs.current[task.id] = el;
                          }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const url = URL.createObjectURL(f);
                            setPreviews((p) => ({ ...p, [task.id]: url }));
                            handleScreenshotSubmit(task, f);
                          }}
                        />
                        {previews[task.id] && (
                          <div className="relative h-32 w-full overflow-hidden rounded-xl border border-border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={previews[task.id]}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="gap-2"
                          disabled={
                            state === 'uploading' || state === 'checking'
                          }
                          onClick={() => fileRefs.current[task.id]?.click()}
                        >
                          {state === 'uploading' || state === 'checking' ? (
                            <>
                              <Spinner size="sm" />
                              {state === 'uploading'
                                ? 'Uploading…'
                                : 'Checking…'}
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              {sub ? 'Replace screenshot' : 'Upload screenshot'}
                            </>
                          )}
                        </Button>
                        {errors[task.id] && (
                          <p className="text-sm text-destructive">
                            {errors[task.id]}
                          </p>
                        )}
                        {state === 'done' && (
                          <p className="text-sm text-success">
                            Submitted. Verification is processing — usually completes within about 10 minutes.
                          </p>
                        )}
                        {sub?.status === 'rejected' && sub.admin_notes && (
                          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            Reason: {sub.admin_notes}
                          </p>
                        )}
                      </div>
                    )}
                    {sub?.status === 'approved' && (
                      <p className="flex items-center gap-2 text-sm text-success">
                        <CheckCircle2 className="h-4 w-4" />
                        This task is complete
                      </p>
                    )}
                    {sub?.status === 'pending' && state === 'idle' && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        Screenshot submitted — verification in progress (auto-completes in ~10 minutes)
                      </p>
                    )}
                  </>
                )}

                {isReferral && (
                  <ReferralTaskBody
                    task={task}
                    referralCount={referralCount}
                    submission={sub}
                    onCheck={() => tryCompleteReferralTask(task)}
                  />
                )}

                {!isWhatsApp && !isReferral && (
                  <p className="text-sm text-muted-foreground">
                    This task type will be available in a later update.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function ReferralTaskBody({
  task,
  referralCount,
  submission,
  onCheck,
}: {
  task: VerificationTask;
  referralCount: number;
  submission?: VerificationSubmission;
  onCheck: () => void;
}) {
  const min =
    typeof task.requirements?.min_referrals === 'number'
      ? task.requirements.min_referrals
      : Number(task.requirements?.min_referrals) || 2;
  const done = referralCount >= min;
  const pct = Math.min(100, (referralCount / min) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Users className="h-4 w-4 text-primary" />
        <span className="font-medium">
          {referralCount} / {min} referrals
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            done ? 'bg-success' : 'bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {submission?.status === 'approved' || (done && submission?.status === 'approved') ? (
        <p className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4" /> Task complete
        </p>
      ) : done ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            You met the referral requirement. Submit for admin confirmation.
          </p>
          {!submission && (
            <Button size="sm" onClick={onCheck}>
              Submit for review
            </Button>
          )}
          {submission?.status === 'pending' && (
            <Badge variant="warning">Pending review</Badge>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Share your referral code from the Referral page. {min - referralCount}{' '}
          more needed.
        </p>
      )}
    </div>
  );
}
