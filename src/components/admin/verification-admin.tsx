'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import type { VerificationTask, TaskType } from '@/lib/types/database';

interface SubmissionRow {
  id: string;
  user_id: string;
  task_id: string;
  status: string;
  proof_url: string | null;
  admin_notes: string | null;
  created_at: string;
  profiles?: {
    id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  verification_tasks?: {
    id: string;
    title: string;
    task_type: string;
  } | null;
}

interface VerificationAdminProps {
  tasks: VerificationTask[];
  submissions: SubmissionRow[];
  adminId: string;
}

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'whatsapp_join', label: 'WhatsApp join + screenshot' },
  { value: 'referral_count', label: 'Referral count' },
  { value: 'screenshot_upload', label: 'Screenshot upload' },
  { value: 'custom', label: 'Custom' },
  { value: 'external_link', label: 'External link' },
];

export function VerificationAdmin({
  tasks: initialTasks,
  submissions: initialSubs,
  adminId,
}: VerificationAdminProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [subs, setSubs] = useState(initialSubs);
  const [editTask, setEditTask] = useState<Partial<VerificationTask> | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  function openNew() {
    setEditTask({
      title: '',
      description: '',
      task_type: 'whatsapp_join',
      requirements: { whatsapp_url: '', min_referrals: 2 },
      sort_order: tasks.length + 1,
      is_enabled: true,
      is_required: true,
    });
  }

  function openEdit(t: VerificationTask) {
    setEditTask({ ...t });
  }

  async function saveTask() {
    if (!editTask?.title) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: editTask.title,
      description: editTask.description || null,
      task_type: editTask.task_type || 'custom',
      requirements: editTask.requirements || {},
      sort_order: editTask.sort_order ?? 0,
      is_enabled: editTask.is_enabled ?? true,
      is_required: editTask.is_required ?? true,
    };

    if (editTask.id) {
      const { error } = await supabase
        .from('verification_tasks')
        .update(payload)
        .eq('id', editTask.id);
      if (error) {
        setMsg(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from('verification_tasks').insert({
        ...payload,
        created_by: adminId,
      });
      if (error) {
        setMsg(error.message);
        setSaving(false);
        return;
      }
    }

    setEditTask(null);
    setSaving(false);
    setMsg('Task saved');
    router.refresh();
  }

  async function toggleEnabled(task: VerificationTask) {
    const supabase = createClient();
    await supabase
      .from('verification_tasks')
      .update({ is_enabled: !task.is_enabled })
      .eq('id', task.id);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, is_enabled: !t.is_enabled } : t
      )
    );
    router.refresh();
  }

  async function approve(subId: string, _userId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('verification_submissions')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', subId);
    if (error) {
      setMsg(error.message);
      return;
    }
    // recompute is triggered by DB
    setSubs((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: 'approved' } : s))
    );
    setMsg('Submission approved');
    router.refresh();
  }

  async function reject(subId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('verification_submissions')
      .update({
        status: 'rejected',
        admin_notes: rejectNote || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', subId);
    if (error) {
      setMsg(error.message);
      return;
    }
    setSubs((prev) =>
      prev.map((s) => (s.id === subId ? { ...s, status: 'rejected' } : s))
    );
    setRejectId(null);
    setRejectNote('');
    setMsg('Submission rejected');
    router.refresh();
  }

  async function getProofUrl(path: string) {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const supabase = createClient();
    const { data } = await supabase.storage
      .from('verification')
      .createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  }

  const reqs = (editTask?.requirements || {}) as Record<string, unknown>;

  return (
    <div className="space-y-8">
      {msg && (
        <p className="rounded-xl bg-muted px-4 py-2 text-sm text-center">
          {msg}
        </p>
      )}

      {/* Tasks */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Verification tasks</h2>
            <p className="text-sm text-muted-foreground">
              Create and configure tasks users must complete
            </p>
          </div>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add task
          </Button>
        </div>

        <div className="space-y-3">
          {tasks.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{t.title}</span>
                    <Badge variant="outline">{t.task_type}</Badge>
                    {t.is_required && <Badge variant="secondary">Required</Badge>}
                    {!t.is_enabled && <Badge variant="muted">Disabled</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {t.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={t.is_enabled}
                    onCheckedChange={() => toggleEnabled(t)}
                    label={t.is_enabled ? 'On' : 'Off'}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(t)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No tasks yet. Click “Add task” to create one.
            </p>
          )}
        </div>
      </section>

      {/* Submissions */}
      <section>
        <h2 className="mb-1 text-lg font-semibold">Submissions</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Review and approve or reject user proofs
        </p>
        <div className="space-y-3">
          {subs.map((s) => (
            <Card key={s.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {s.profiles?.display_name || s.profiles?.email || s.user_id}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {s.verification_tasks?.title} ·{' '}
                      {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      s.status === 'approved'
                        ? 'success'
                        : s.status === 'rejected'
                          ? 'destructive'
                          : 'warning'
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
                {s.proof_url && (
                  <ProofPreview path={s.proof_url} getUrl={getProofUrl} />
                )}
                {s.status === 'pending' && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      className="gap-1"
                      onClick={() => approve(s.id, s.user_id)}
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setRejectId(s.id)}
                    >
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {subs.length === 0 && (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          )}
        </div>
      </section>

      {/* Edit task modal */}
      <Modal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        title={editTask?.id ? 'Edit task' : 'New verification task'}
        size="lg"
      >
        {editTask && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editTask.title || ''}
                onChange={(e) =>
                  setEditTask({ ...editTask, title: e.target.value })
                }
                placeholder="e.g. Join WhatsApp Channel"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editTask.description || ''}
                onChange={(e) =>
                  setEditTask({ ...editTask, description: e.target.value })
                }
                placeholder="Explain what the user must do"
              />
            </div>
            <div className="space-y-2">
              <Label>Task type</Label>
              <Select
                value={editTask.task_type || 'custom'}
                onChange={(e) =>
                  setEditTask({
                    ...editTask,
                    task_type: e.target.value as TaskType,
                  })
                }
              >
                {TASK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            {(editTask.task_type === 'whatsapp_join' ||
              editTask.task_type === 'screenshot_upload') && (
              <div className="space-y-2">
                <Label>WhatsApp / group URL</Label>
                <Input
                  value={(reqs.whatsapp_url as string) || ''}
                  onChange={(e) =>
                    setEditTask({
                      ...editTask,
                      requirements: {
                        ...reqs,
                        whatsapp_url: e.target.value,
                      },
                    })
                  }
                  placeholder="https://chat.whatsapp.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Users will open this link from the verification screen.
                </p>
              </div>
            )}
            {editTask.task_type === 'referral_count' && (
              <div className="space-y-2">
                <Label>Minimum referrals required</Label>
                <Input
                  type="number"
                  min={1}
                  value={Number(reqs.min_referrals) || 2}
                  onChange={(e) =>
                    setEditTask({
                      ...editTask,
                      requirements: {
                        ...reqs,
                        min_referrals: Number(e.target.value) || 2,
                      },
                    })
                  }
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={editTask.sort_order ?? 0}
                onChange={(e) =>
                  setEditTask({
                    ...editTask,
                    sort_order: Number(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex flex-wrap gap-6">
              <Switch
                checked={editTask.is_enabled ?? true}
                onCheckedChange={(v) =>
                  setEditTask({ ...editTask, is_enabled: v })
                }
                label="Enabled"
              />
              <Switch
                checked={editTask.is_required ?? true}
                onCheckedChange={(v) =>
                  setEditTask({ ...editTask, is_required: v })
                }
                label="Required for verification"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={saveTask} disabled={saving} className="gap-2">
                {saving && <Spinner size="sm" />}
                Save task
              </Button>
              <Button variant="outline" onClick={() => setEditTask(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        title="Reject submission"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason (shown to user)</Label>
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Screenshot does not show membership"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => rejectId && reject(rejectId)}
            >
              Confirm reject
            </Button>
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ProofPreview({
  path,
  getUrl,
}: {
  path: string;
  getUrl: (p: string) => Promise<string | null>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const u = await getUrl(path);
    setUrl(u);
    setLoading(false);
  }

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt="Proof"
        className="max-h-48 rounded-xl border border-border object-contain"
      />
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={load} disabled={loading}>
      {loading ? <Spinner size="sm" /> : 'View screenshot'}
    </Button>
  );
}

