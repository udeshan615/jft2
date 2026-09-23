# Implementation Summary — Prompt 10

## 1. Files changed / added
- `supabase/migrations/009_auto_verification_fees_email.sql` (new)
- `src/components/dashboard/learning-cards.tsx` — fixed all lesson routes
- `src/components/verification/verification-client.tsx` — auto-approve polling, referral RPC, emails
- `src/components/earnings/earnings-client.tsx` — Confirm PM button, bank fee UI, Mobile Reload label, fee-aware balance check, withdrawal email
- `src/app/page.tsx` — modern homepage (hero, language, categories)
- `src/components/auth/login-form.tsx` — show/hide password, larger tap targets
- `src/components/admin/users-admin.tsx` (new)
- `src/app/admin/users/page.tsx` — real users list
- `src/components/admin/system-settings-admin.tsx` — bank fee, email toggles, homepage fields
- `src/lib/services/email.ts` (new) — server-side email
- `src/app/api/email/send/route.ts` (new)
- `.env.example` — EMAIL_USER / EMAIL_APP_PASSWORD
- `package.json` — nodemailer dependency

## 2. Database changes
- Settings: `verification_auto_approve_minutes`, `bank_fee_enabled`, `bank_fee_amount`, email toggles, homepage hero fields
- Tables: `email_templates`, `homepage_categories`
- Column: `verification_submissions.auto_approve_at`
- Functions: `process_auto_approvals`, `run_due_auto_approvals`, `set_verification_auto_approve`, `try_auto_complete_referral_task`, updated `create_withdrawal_request` (bank fee)
- Triggers: auto-approve schedule on submit; referral auto-complete on referral insert/update

## 3. Verification
- WhatsApp proof → pending/processing (no admin task required for auto path)
- `auto_approve_at` set server-side (default 10 min)
- Client polls `run_due_auto_approvals` every 30s; works after refresh/close (DB-enforced)
- Users cannot self-approve

## 4. Referral
- When valid referral count ≥ 2, `try_auto_complete_referral_task` marks referral task **approved** server-side
- Trigger on `referrals` table; no admin approval required

## 5. Payment method
- Confirm/Save button only appears when required fields are filled
- Loading state + min height 48px for mobile
- Validation before insert

## 6. Mobile Reload
- Type labeled “Mobile Reload”; only phone number required
- No bank fields; no bank fee

## 7–8. Bank withdrawal & fee
- Custom amount supported
- Admin `bank_fee_enabled` + `bank_fee_amount` (default 30)
- Fee applied server-side only for `type = bank`
- UI shows withdrawal + fee + total before confirm
- Balance check includes fee

## 9–12. Email system
- Templates in DB (editable keys: verification_success, withdrawal_confirmation)
- Placeholders: `{{name}}`, `{{email}}`, `{{amount}}`, `{{fee}}`, `{{total}}`, `{{date}}`, `{{status}}`, `{{payment_method}}`
- Admin toggles for verification/withdrawal emails
- Credentials: `EMAIL_USER`, `EMAIL_APP_PASSWORD` (server-only); never in frontend
- API: `POST /api/email/send`

## 13. Lesson buttons
- Dashboard learning cards now link to real routes:
  `/daily-game`, `/learning/model-papers`, `/learning/past-papers`, `/learning/practice`,
  `/learning/kanji`, `/learning/grammar`, `/learning/listening`, `/learning/reading`,
  Kaiwa → listening, Rōmaji → `/learning`
- Learning hub already had correct routes

## 14–15. Sign-in & Homepage UI
- Login: logo, large inputs, show/hide password, Sign In CTA, Create Account link
- Homepage: sticky header, hero with gradient visual, “Which language…”, “What can you learn?” cards, features, auth-aware CTAs

## 16. Admin Users
- Loads real `profiles` + wallet balances + referral counts
- Search, status filter, pagination, mobile cards
- Admin-only (role check + existing RLS)

## 17. Security
- Balance changes only via SECURITY DEFINER RPCs
- Auto-approve / referral complete only via server functions
- Email secrets server-side only
- Admin pages check `role === 'admin'`

## 18. Mobile
- 48px+ tap targets on primary buttons
- Modal already bottom-sheet on small screens
- Homepage grids 2-col on narrow screens

## 19. Deploy steps
1. Run migration `009_auto_verification_fees_email.sql` on Supabase
2. Set `EMAIL_USER` and `EMAIL_APP_PASSWORD` in Vercel/server env
3. `npm i` (nodemailer)
4. Optional: schedule `SELECT process_auto_approvals();` via pg_cron every 5 min for users who never reopen the verification page

## 20. Remaining / optional
- Full email template WYSIWYG editor UI (templates table + API ready; basic toggles in System Settings)
- Admin image upload for hero via Storage (settings field exists; UI can be extended)
- Dedicated Rōmaji/Hiragana/Katakana pages if content is added later
- Install and configure real SMTP; without env vars emails are skipped safely
