/**
 * Database types for Japanese Learning & Rewards App
 * Phase 1 foundation – aligned with supabase/migrations/001_initial_schema.sql
 */

export type UserRole = 'user' | 'admin';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type TaskType =
  | 'whatsapp_join'
  | 'referral_count'
  | 'screenshot_upload'
  | 'custom'
  | 'external_link';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type TransactionType =
  | 'credit'
  | 'debit'
  | 'referral_bonus'
  | 'daily_game'
  | 'withdrawal'
  | 'adjustment'
  | 'reward';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
export type PaymentMethodType = 'bank' | 'mobile_money' | 'other';
export type AnnouncementStatus = 'draft' | 'published' | 'archived';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  verification_status: VerificationStatus;
  referral_code: string | null;
  referred_by: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  granted_by: string | null;
  granted_at: string;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  is_public: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationTask {
  id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  requirements: Record<string, unknown>;
  sort_order: number;
  is_enabled: boolean;
  is_required: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VerificationSubmission {
  id: string;
  user_id: string;
  task_id: string;
  status: SubmissionStatus;
  proof_url: string | null;
  proof_metadata: Record<string, unknown>;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserVerification {
  id: string;
  user_id: string;
  status: VerificationStatus;
  completed_tasks: number;
  required_tasks: number;
  verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance_lkr: number;
  pending_lkr: number;
  lifetime_earned_lkr: number;
  lifetime_withdrawn_lkr: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount_lkr: number;
  balance_after: number | null;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: PaymentMethodType;
  label: string | null;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  branch: string | null;
  phone_number: string | null;
  is_default: boolean;
  is_verified: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  payment_method_id: string | null;
  amount_lkr: number;
  status: WithdrawalStatus;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  reward_amount_lkr: number;
  rewarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  status: AnnouncementStatus;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadedAsset {
  id: string;
  owner_id: string | null;
  bucket: string;
  path: string;
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  purpose: string | null;
  metadata: Record<string, unknown>;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_entity: string | null;
  target_id: string | null;
  previous_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/** Combined user session data used across the app */
export interface AppUser {
  id: string;
  email: string | null;
  profile: Profile | null;
  role: UserRole;
  wallet: Wallet | null;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  verification_intro_seen: boolean;
  dashboard_intro_seen: boolean;
  earnings_intro_seen: boolean;
  referral_intro_seen: boolean;
  preferences: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export type DailyGameStatus = 'draft' | 'published' | 'live' | 'ended' | 'cancelled';

export interface DailyGame {
  id: string;
  title: string;
  description: string | null;
  status: DailyGameStatus;
  starts_at: string;
  ends_at: string;
  prize_amount_lkr: number;
  max_winners: number;
  leaderboard_size: number;
  require_verified: boolean;
  max_attempts: number;
  time_limit_seconds: number | null;
  is_enabled: boolean;
  config: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyGameQuestion {
  id: string;
  game_id: string;
  question_text: string;
  question_type: string;
  image_url: string | null;
  options: { id: string; text: string }[];
  correct_option_id?: string | null;
  points: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DailyGameAttempt {
  id: string;
  game_id: string;
  user_id: string;
  started_at: string;
  submitted_at: string | null;
  score: number;
  max_score: number;
  duration_ms: number | null;
  status: string;
  answers: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface DailyGameWinner {
  id: string;
  game_id: string;
  user_id: string;
  attempt_id: string | null;
  rank: number | null;
  score: number | null;
  prize_amount_lkr: number;
  prize_awarded: boolean;
  prize_transaction_id: string | null;
  notes: string | null;
  selected_by: string | null;
  selected_at: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  score: number;
  duration_ms: number | null;
  submitted_at: string | null;
  attempt_id: string;
}

// ---- Phase 4: Referrals ----
export type ReferralStatus =
  | 'registered'
  | 'pending'
  | 'verified'
  | 'qualified'
  | 'rewarded';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: ReferralStatus | string;
  reward_amount_lkr: number;
  rewarded_at: string | null;
  qualified_at: string | null;
  reward_transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  referred_profile?: {
    display_name: string | null;
    verification_status: VerificationStatus;
    created_at: string;
  } | null;
}

export interface ReferralStats {
  total: number;
  registered: number;
  verified: number;
  qualified: number;
  rewarded: number;
  earnings_lkr: number;
}

export type ReferralGameStatus =
  | 'draft'
  | 'published'
  | 'live'
  | 'ended'
  | 'cancelled';

export interface ReferralGame {
  id: string;
  title: string;
  description: string | null;
  status: ReferralGameStatus;
  is_enabled: boolean;
  starts_at: string;
  ends_at: string;
  points_per_qualified: number;
  min_qualified_for_leaderboard: number;
  leaderboard_size: number;
  prize_amount_lkr: number;
  max_winners: number;
  prize_enabled: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralGameLeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  qualified_count: number;
  score: number;
  first_qualified_at: string | null;
}

export interface ReferralGameWinner {
  id: string;
  game_id: string;
  user_id: string;
  rank: number;
  score: number;
  qualified_count: number;
  prize_amount_lkr: number;
  prize_awarded: boolean;
  prize_transaction_id: string | null;
  admin_note: string | null;
  selected_by: string | null;
  selected_at: string;
  awarded_at: string | null;
  created_at: string;
  profiles?: { display_name?: string | null } | null;
}
