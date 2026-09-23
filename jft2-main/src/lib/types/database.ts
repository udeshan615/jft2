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

// ---- Phase 5: Learning Content ----
export type ContentStatus = 'draft' | 'needs_review' | 'published' | 'archived';
export type ContentKind =
  | 'model_paper'
  | 'past_paper'
  | 'kanji_book'
  | 'grammar'
  | 'listening'
  | 'reading';
export type QuestionType =
  | 'multiple_choice'
  | 'image'
  | 'japanese_sentence'
  | 'kaiwa'
  | 'reading'
  | 'listening'
  | 'kanji_meaning'
  | 'kanji_reading'
  | 'kanji_sinhala';
export type ImportStatus =
  | 'uploading'
  | 'processing'
  | 'extracting'
  | 'needs_review'
  | 'completed'
  | 'failed';
export type PracticeSessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface ContentCollection {
  id: string;
  kind: ContentKind;
  title: string;
  description: string | null;
  slug: string | null;
  book_number: number | null;
  paper_number: number | null;
  level: string | null;
  difficulty: string | null;
  version: number;
  status: ContentStatus;
  is_active_version: boolean;
  sort_order: number;
  cover_image_url: string | null;
  metadata: Record<string, unknown>;
  requires_verification: boolean;
  time_limit_minutes: number | null;
  created_by: string | null;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningModule {
  id: string;
  collection_id: string;
  title: string;
  description: string | null;
  section_key: string | null;
  lesson_number: number | null;
  sort_order: number;
  status: ContentStatus;
  content_body: string | null;
  content_body_reading: string | null;
  content_body_sinhala: string | null;
  image_url: string | null;
  audio_url: string | null;
  audio_duration_seconds: number | null;
  transcript: string | null;
  speaker_a_label: string | null;
  speaker_b_label: string | null;
  speaker_a_audio_url: string | null;
  speaker_b_audio_url: string | null;
  estimated_minutes: number | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  question_type: QuestionType;
  prompt: string;
  prompt_japanese: string | null;
  prompt_sinhala: string | null;
  explanation: string | null;
  explanation_sinhala: string | null;
  image_url: string | null;
  audio_url: string | null;
  points: number;
  difficulty: string | null;
  metadata: Record<string, unknown>;
  status: ContentStatus;
  confidence: string | null;
  source_import_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  label: string;
  option_text: string;
  option_text_japanese: string | null;
  is_correct: boolean;
  sort_order: number;
  image_url: string | null;
  created_at: string;
}

export interface ModuleQuestion {
  id: string;
  module_id: string;
  question_id: string;
  sort_order: number;
  question?: Question;
}

export interface KanjiEntry {
  id: string;
  collection_id: string;
  module_id: string | null;
  kanji: string;
  reading: string | null;
  meaning_en: string | null;
  meaning_si: string | null;
  example_sentence: string | null;
  example_reading: string | null;
  example_meaning: string | null;
  stroke_count: number | null;
  image_url: string | null;
  sort_order: number;
  lesson_number: number | null;
  status: ContentStatus;
  metadata: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentImport {
  id: string;
  kind: ContentKind;
  collection_id: string | null;
  filename: string;
  storage_path: string | null;
  original_text: string | null;
  status: ImportStatus;
  parser_used: string | null;
  error_message: string | null;
  stats: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImportExtractedItem {
  id: string;
  import_id: string;
  item_type: string;
  sort_order: number;
  raw_segment: string | null;
  extracted: Record<string, unknown>;
  confidence: string | null;
  review_status: string;
  approved_question_id: string | null;
  approved_kanji_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  collection_id: string | null;
  module_id: string | null;
  kind: ContentKind;
  status: PracticeSessionStatus;
  total_questions: number;
  correct_count: number;
  score: number;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PracticeAnswer {
  id: string;
  session_id: string;
  question_id: string | null;
  kanji_entry_id: string | null;
  selected_option_id: string | null;
  selected_text: string | null;
  is_correct: boolean | null;
  points_earned: number;
  answered_at: string;
  time_spent_ms: number | null;
}

export interface UserProgress {
  id: string;
  user_id: string;
  collection_id: string | null;
  module_id: string | null;
  kind: ContentKind;
  attempts: number;
  correct_answers: number;
  incorrect_answers: number;
  best_score: number;
  last_score: number;
  completion_percent: number;
  is_completed: boolean;
  last_practiced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  asset_type: string;
  bucket: string;
  related_collection_id: string | null;
  related_module_id: string | null;
  related_question_id: string | null;
  uploaded_by: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtractedQuestionDraft {
  prompt: string;
  options: { label: string; text: string; is_correct?: boolean }[];
  correct_label?: string;
  explanation?: string;
  question_type?: QuestionType;
  section?: string;
  confidence: 'high' | 'medium' | 'low' | 'needs_review';
  raw_segment?: string;
}

export interface ExtractedKanjiDraft {
  kanji: string;
  reading?: string;
  meaning_en?: string;
  meaning_si?: string;
  example_sentence?: string;
  example_reading?: string;
  confidence: 'high' | 'medium' | 'low' | 'needs_review';
  raw_segment?: string;
}
