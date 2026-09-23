h# Nihongo Rewards – Japanese Learning & Rewards Platfborbm
h
**Phase 1 Foundation** – Authentication, roles, database schema, design system, navigation, admin panel structbsbure.
jsjs

A production-quality foundation for a Japanese learning application with rewards, verification, referrals, and educational content. Built for Vercel + Supabase.

---

## Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **UI**: Custom design system (Japanese-inspired, soft, premium)
- **Deployment**: Vercel

---

## Folder Structure

```
japanese-learning-app/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login & Register
│   │   ├── (app)/           # Protected user routes (Dashboard, Earnings, Referral, Contact, Profile)
│   │   ├── admin/           # Protected admin panel (all sections)
│   │   ├── layout.tsx
│   │   ├── page.tsx         # Landing
│   │   └── globals.css      # Design tokens
│   ├── components/
│   │   ├── ui/              # Button, Card, Input, Badge, Avatar, Spinner, etc.
│   │   ├── layout/          # BottomNav, AppHeader
│   │   ├── auth/            # LoginForm, RegisterForm
│   │   └── admin/           # AdminSidebar
│   ├── lib/
│   │   ├── supabase/        # Client, Server, Middleware helpers
│   │   ├── services/        # Auth & role services
│   │   ├── types/           # Database TypeScript types
│   │   └── utils/           # cn() etc.
│   └── middleware.ts        # Session refresh + route protection
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.example
├── package.json
└── README.md
```

---

## Phase 1 Status – What is Complete

- [x] Next.js + TypeScript + Tailwind project
- [x] Supabase Auth (register, login, logout, session)
- [x] Role-based access (USER / ADMIN) enforced server-side + RLS
- [x] Full database schema (15+ tables) with RLS policies
- [x] System settings & admin-configurable architecture
- [x] Verification task architecture (admin-configurable)
- [x] Storage bucket conventions documented
- [x] Admin audit log table
- [x] Design system (tokens, Button, Card, Input, Badge, Avatar, etc.)
- [x] Mobile bottom navigation + desktop header
- [x] Admin panel with sidebar and all section placeholders
- [x] Profile foundation
- [x] Protected routes (user + admin)
- [x] Beginner-friendly first-admin setup
- [x] Vercel-ready configuration
- [x] README & environment docs

**Phase 2 delivered** verification UI, announcements, profile photo, admin controls for tasks/submissions/announcements/settings. Earnings, full Daily Game, papers, and practice modules remain for later phases.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose organization, name (e.g. `nihongo-rewards`), set a strong database password, pick a region close to your users.
4. Wait until the project is ready (green status).

### Get API keys

1. In the left sidebar click **Project Settings** (gear icon).
2. Click **API**.
3. Copy:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Run the database migration

1. In the left sidebar click **SQL Editor**.
2. Click **New query**.
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project.
4. Copy the **entire** contents and paste into the SQL Editor.
5. Click **Run** (or press Ctrl/Cmd + Enter).
6. You should see “Success. No rows returned” (or similar). Tables, policies, triggers and functions are now created.

### Create Storage buckets (Dashboard)

1. Left sidebar → **Storage**.
2. Create these buckets (click **New bucket** for each):

| Bucket name     | Public? | Purpose                          |
|-----------------|---------|----------------------------------|
| `avatars`       | Yes     | Profile photos                   |
| `verification`  | No      | Verification screenshots         |
| `announcements` | Yes     | Announcement images              |
| `educational`   | No      | Learning assets                  |
| `papers`        | No      | Model / past paper images        |
| `audio`         | No      | Listening practice audio         |
| `media`         | No      | General private media            |

3. For private buckets, keep **Public bucket** unchecked.
4. Storage policies can be refined later; for Phase 1 the database + RLS is the main security layer.

### Auth settings (recommended)

1. **Authentication** → **Providers** → Email enabled.
2. **Authentication** → **URL Configuration**:
   - Site URL: `http://localhost:3000` (local) or your Vercel URL (production).
   - Redirect URLs: add `http://localhost:3000/**` and your production domain.

---

## 2. Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never put the **service_role** key in the frontend or in any `NEXT_PUBLIC_` variable.

---

## 3. First Admin Setup (Beginner-Friendly)

**Do not** expose a public “make me admin” button. Use this one-time secure process.

### Step A – Register a normal account

1. Start the app (`npm run dev`).
2. Open http://localhost:3000
3. Click **Get started** / **Create account**.
4. Register with the email you want to use as admin.
5. After signup you land on the Dashboard as a normal user.

### Step B – Set a one-time secret

1. Go to Supabase Dashboard → **SQL Editor** → New query.
2. Run this (replace the secret with something long and random, e.g. a password generator):

```sql
UPDATE public.system_settings
SET value = '"MySuperSecretSetupKey-ChangeMe123!"'
WHERE key = 'first_admin_setup_secret';
```

3. Click **Run**.

### Step C – Promote yourself to admin

Still in SQL Editor, run (use the **exact same** secret and the email you registered with):

```sql
SELECT public.bootstrap_first_admin(
  'your-email@example.com',
  'MySuperSecretSetupKey-ChangeMe123!'
);
```

You should see a message like:  
`SUCCESS: User your-email@example.com is now an admin. Secret has been cleared.`

### Step D – Verify

1. Log out of the app (or refresh).
2. Log in again with the same account.
3. You should now see an **Admin** button in the header (desktop) and be able to open `/admin/overview`.

The secret is automatically cleared after successful use, so it cannot be reused.

---

## 4. Local Development

```bash
# Install dependencies
npm install

# Copy env
cp .env.example .env.local
# (edit .env.local with your Supabase values)

# Start
npm run dev
```

Open http://localhost:3000

---

## 5. Vercel Deployment (Beginner Steps)

### A. Push to GitHub

1. Create a new repository on GitHub (do not initialize with README if the project already has one).
2. In the project folder:

```bash
git init
git add .
git commit -m "Phase 1 foundation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### B. Import into Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in (GitHub recommended).
2. Click **Add New…** → **Project**.
3. Import the GitHub repository you just pushed.
4. Framework Preset should detect **Next.js**.
5. **Environment Variables** – add the same three variables:

   | Name                            | Value                          |
   |---------------------------------|--------------------------------|
   | `NEXT_PUBLIC_SUPABASE_URL`      | your Supabase Project URL      |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key         |
   | `NEXT_PUBLIC_SITE_URL`          | `https://your-app.vercel.app`  |

6. Click **Deploy**.

### C. After first deploy

1. In Supabase → Authentication → URL Configuration, set:
   - Site URL = your Vercel URL
   - Redirect URLs include `https://your-app.vercel.app/**`
2. Test registration and login on the live URL.
3. Repeat the **First Admin Setup** if this is a fresh production database (or run the same SQL against the production project).

---

## 6. Security Notes

- Admin checks are performed **server-side** (`requireAdmin` / layout) **and** via Postgres RLS + `is_admin()` function.
- A user cannot grant themselves admin by changing client state.
- Service role key is never exposed to the browser.
- Sensitive uploads go into private Storage buckets.

---

## 7. What Comes in Phase 2 (Suggested)

- Verification task UI + submission flow
- Admin: create/edit verification tasks
- Admin: approve/reject submissions
- Payment methods + withdrawal request/approval
- Referral link + copy + leaderboard
- Announcement CRUD + slideshow on dashboard
- System settings editor in Admin Panel
- Profile photo upload
- Basic earnings transaction history

Later phases will cover educational modules, daily game, AI paper tools, etc.

---


---

## Phase 2 Status – What was completed

- [x] Premium floating mobile bottom navigation
- [x] Dashboard profile header (photo, name, verification badge, balance)
- [x] Verification status card with progress
- [x] Announcement slideshow (auto-rotate, swipe, indicators, empty state)
- [x] Daily Game card foundation (UPCOMING / LIVE / ENDED from settings)
- [x] Learning content cards (8 modules, ready for later routes)
- [x] Profile page: photo upload (avatars bucket), display name edit, logout
- [x] Verification page with intro modal (SectionIntroModal)
- [x] Dynamic verification tasks from database (WhatsApp + screenshot, referral count)
- [x] Screenshot upload to private `verification` storage + pending submission
- [x] Referral progress UI (reads min_referrals from task config)
- [x] Contact page driven by system_settings
- [x] Admin: Verification tasks CRUD (title, type, WhatsApp URL, referrals, enable, required, order)
- [x] Admin: Review submissions (view proof via signed URL, approve/reject with reason)
- [x] Admin: Announcements CRUD (image upload, publish, dates, order)
- [x] Admin: System settings form (contact, daily game times, referral %, etc.)
- [x] DB migration `002_phase2_verification_announcements.sql` (user_preferences, seeds, recompute_user_verification)
- [x] Reusable SectionIntroModal component

### New migration (run in Supabase SQL Editor)

Run **after** `001_initial_schema.sql`:

`supabase/migrations/002_phase2_verification_announcements.sql`

This creates `user_preferences`, seeds default verification tasks, contact/daily-game settings, and auto-recompute verification status on submission approve/reject.

### Storage buckets (required for Phase 2)

| Bucket | Public | Use |
|--------|--------|-----|
| avatars | Yes | Profile photos |
| verification | **No** | Screenshot proofs |
| announcements | Yes | Slideshow images |

**Suggested storage policies (Dashboard → Storage → Policies):**

- **avatars**: public read; authenticated users can upload/update only under folder `{user_id}/`
- **verification**: no public access; authenticated users insert only under `{user_id}/`; admins can read
- **announcements**: public read; admins insert/update/delete

### Admin: Phase 2 how-to

1. **Verification → Add task**  
   - Type “WhatsApp join + screenshot” → set WhatsApp URL  
   - Type “Referral count” → set minimum referrals (e.g. 2)
2. **Verification → Submissions**  
   - Open screenshot → Approve or Reject (with reason)
3. **Announcements → Add**  
   - Upload image, set Published, optional start/end dates
4. **System Settings**  
   - Contact email / WhatsApp, daily game start/end times

### Known limitations (Phase 2)

- Earnings / withdrawal / payment methods not implemented
- Daily Game is UI-only (no play logic)
- Referral leaderboard / games not implemented
- Learning modules are cards only (no content)
- Referral task completion still requires admin approve (or future auto-approve job)
- Screenshot is **not** auto-verified by AI; admin reviews

### Reserved for Phase 3+

Full Earnings, withdrawals, Daily Game logic, Referral games, Model/Past papers, Kanji/Grammar/Listening/Reading practice, AI paper tools.


---

## Phase 3 Status – Earnings, Withdrawals & Daily Game

### Implemented

- [x] Earnings page: balance, pending, lifetime earned/withdrawn
- [x] Payment methods (bank + mobile) add/delete/default
- [x] Withdrawal requests via secure RPC (`create_withdrawal_request`) — holds balance
- [x] Withdrawal history + transaction history
- [x] Admin Withdrawals: approve / processing / paid / reject (RPC `process_withdrawal`)
- [x] Admin Earnings overview (totals + recent tx)
- [x] Daily Game tables: games, questions, attempts, winners
- [x] User Daily Game flow: lobby states, play MCQ, server-side scoring (`submit_daily_game_attempt`)
- [x] Leaderboard (score → duration → submit time)
- [x] Admin Daily Game: create/edit game, questions, select winner, award prize (`award_daily_game_prize`)
- [x] Admin wallet credit/adjust (`wallet_credit`, `admin_wallet_adjust`)
- [x] Audit logs on financial actions
- [x] Payment settings in System Settings (enable bank/mobile, min/max withdrawal)

### New migration

Run **after** 001 and 002:

`supabase/migrations/003_phase3_earnings_daily_game.sql`

### How to run first Daily Game (beginner)

1. Login as **admin** → sidebar **Daily Game**
2. Click **New game**
3. Set title, **Starts at** / **Ends at** (use future start for testing, or past start + future end for LIVE)
4. Status → **Published** (or Live), Prize amount, Save
5. Click **Manage** → **Add question** → fill text, options, mark Correct, Save question
6. As a normal user: open **Earnings** or **Dashboard Daily Game** → **Start Game** → answer → Submit
7. Admin → Manage → Leaderboard → **Select winner** → confirm award prize

### Withdrawal flow

1. User adds payment method on Earnings
2. User Withdraw → amount ≥ min → Confirm (balance moves to pending)
3. Admin → Withdrawals → Approve → Processing → **Mark paid** (or Reject with reason; balance returned)

### Security notes

- Users **cannot** update `wallets` balance directly (RLS)
- Withdrawals and scoring only via **SECURITY DEFINER** functions
- Prize award only by admin; duplicate award blocked
- One submitted attempt per user per game (unique index)

### Known limitations

- No referral commission payouts yet
- Daily Game is multiple-choice only (architecture ready for more types)
- Manual admin winner selection (no auto-payout from leaderboard alone)
- Timezone: store UTC in DB; datetime-local uses browser local for admin input

### Phase 4 reserved

Referral system, learning content, papers, AI tools, etc.

## License

Private / proprietary – all rights reserved unless otherwise stated.

---

## Phase 4 — Referral system & Referral Game

### What was added

- Unique referral codes (auto on signup)
- Referral links: `/register?ref=CODE`
- Secure attribution via `handle_new_user` metadata (no client-trusted IDs)
- Qualification when referred user becomes **verified**
- Automatic referral reward via `wallet_credit` (`referral_bonus`)
- User Referral dashboard (stats, list, copy/share, game leaderboard)
- Admin Referrals (overview + reward config)
- Referral Game (create/edit, leaderboard, select winner, award prize)
- Migration `004_phase4_referral_system.sql`

### Supabase setup (required)

1. SQL Editor → run **`004_phase4_referral_system.sql`** (after 001–003)
2. No new storage buckets required
3. Auth Site URL / Redirect URLs must include production domain

### Admin setup

1. **Admin → Referrals**
   - Toggle reward on/off
   - Set LKR amount per qualified referral
2. **Admin → Referral Game**
   - New game → set dates, points, prize
   - Status `published`/`live` + **Enabled**
   - Leaderboard → Select winner → Award prize

### User test

1. User A copies referral code/link
2. User B opens `/register?ref=CODE` and registers
3. Admin verifies User B (or complete verification flow)
4. User A gets `referral_bonus` transaction + wallet credit
5. During a live Referral Game, qualified counts rank on the leaderboard

### Security

- Self-referral blocked (DB constraint + trigger)
- One referral row per referred user (`referred_id` UNIQUE)
- Rewards/prizes only via SECURITY DEFINER RPCs
- Users cannot change qualification or scores

### Env

Same as Phase 3:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (used for share links)

### Known limitations

- Single-level referrals only (no multi-level MLM)
- Qualification tied to verification_status = verified
- Referral Game scores from qualified referrals inside game time window only

---

## Phase 5 – Learning Content System

### Features

- **TXT import** with deterministic parser (works without AI)
- **AI-ready architecture** (optional provider via env vars)
- **Review workflow** – extracted items stay draft until admin approves
- **Content versioning** – publish new version archives previous active
- **Model Papers / Past Papers / Kanji / Grammar / Listening / Reading**
- **Practice sessions** with server-side scoring RPC
- **User progress** tracking (attempts, best score, completion)
- **Past Papers** gated by verification status (RLS + UI)
- Admin content dashboard, search/filter, duplicate, archive, publish

### Migration

Run in Supabase SQL Editor **after** previous migrations:

```
supabase/migrations/005_phase5_learning_content.sql
```

### TXT import workflow (beginner)

1. Admin → **Learning Content**
2. Create a collection first (e.g. Admin → Model Papers → Create)
3. Upload or paste a `.txt` file
4. Choose content type and target collection
5. Click **Process & extract**
6. Review each item (fix needs_review warnings)
7. **Approve pending into collection** (saves as draft questions/kanji)
8. Open the collection → **Publish** when ready

### Example TXT formats

**Questions:**
```
Question 1
What is the capital of Japan?
A. Osaka
B. Tokyo
C. Kyoto
D. Nagoya
Answer: B
Explanation: Tokyo is the capital.

Question 2
...
```

**Kanji (pipe-separated):**
```
漢|かん|China|චීන
字|じ|character|අකුර
```

### Storage buckets (optional for Phase 5 media)

Create if needed: `papers`, `audio`, `media` (private recommended).

### Environment variables (optional AI)

```
AI_PARSER_ENABLED=false
AI_PARSER_PROVIDER=none
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

Never put AI keys in `NEXT_PUBLIC_*` variables.

### User routes

- `/learning` – hub
- `/learning/model-papers`, `/past-papers`, `/kanji`, `/grammar`, `/listening`, `/reading`
- `/learning/practice?collection=<id>&kind=<kind>`

### Admin role note

If you have both `user` and `admin` roles, the app now correctly prefers `admin`
(fixed in `getCurrentUser`).

### Known limitations

- Deterministic parser covers common MCQ / kanji line formats; unusual layouts may need manual edit in review.
- Optional AI provider is configured via env but not required for production use.
- Drag-and-drop reordering UI is not included; use `sort_order` via Manage/publish workflow.
- Audio player works with uploaded URLs; browser download prevention is best-effort only.

---

**PHASE 5 COMPLETE — READY FOR PHASE 6**

---

## Phase 6 – Products, Referral Commissions & Games

### Features

- **Paid products** (draft → published) with price, category, optional commission override
- **Secure order flow**: user creates order → admin confirms payment → access granted
- **Referral commissions** on qualifying purchases (global % or product-specific)
- **Commission lifecycle**: pending → approved/paid → reversible
- **Idempotent commission** keys (no duplicate for same order)
- **Refund** cancels pending commissions / reverses paid ones
- **Referral Game** (from Phase 4) + prizes via wallet
- **Shop** `/shop`, product detail, **My Purchases** `/purchases`
- Admin: Products, Orders, Commissions panels
- How-it-works on Referral page uses live admin settings (not hardcoded %)

### Commission priority

1. Product fixed commission if set  
2. Else product commission % if set  
3. Else global `referral_commission_percent`  
4. If commission disabled globally or on product → none  

### Migration

Run after 001–005:

```
supabase/migrations/006_phase6_products_commissions.sql
```

### Payment note

There is **no automatic card gateway** in this phase. Provider setting defaults to `manual`.

1. User clicks Purchase → order `awaiting_payment`
2. User pays offline / bank transfer as you instruct
3. Admin → Orders → **Confirm paid** (only after real payment)
4. Access granted + pending commission created if referrer exists

Do **not** treat browser success as payment. Wire a real provider later via `payment_provider` setting.

### Environment

Same as previous phases. Optional:

```
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

Used for referral links (`/register?ref=CODE`).

### Known limitations

- Manual/admin payment confirmation (by design until a gateway is connected)
- Product image upload UI is minimal (URL/field via future enhancement)
- Attribution window cookie is documented; signup uses `?ref=` + user_metadata primarily

---

**PHASE 6 COMPLETE — READY FOR PHASE 7**

---

## Phase 7 – Notifications, Support, Analytics & Hardening

### Features

- **In-app notifications** with unread badge, dropdown, and full `/notifications` page
- **Notification preferences** (earnings, games, referral, product, learning, announcements, support)
- **Settings** page: display name, prefs, password change, sign out
- **Support tickets** on Contact page + admin Support panel (internal notes hidden from users)
- **FAQ** admin + published FAQs on Contact
- **Admin analytics** overview with 7/30/90 day aggregates (RPC, not raw dumps)
- **User activity** table + `log_user_activity` helper
- **Announcement** columns: link, image, schedule, audience
- RLS on all new tables

### Migration

```
supabase/migrations/007_phase7_notifications_support_analytics.sql
```

### Security notes

- Users only see their own notifications and tickets
- Internal support messages require admin; users never receive `is_internal` rows via RLS
- Analytics RPC is admin-only
- No service-role or payment secrets in client env
- Financial mutations remain SECURITY DEFINER admin RPCs from earlier phases

### Manual setup

1. Run migration **007**
2. Admin → System Settings: set `contact_email`, `contact_whatsapp`, `support_hours`
3. Admin → FAQ: add common questions
4. Optional: call `create_notification(...)` from admin/SQL when awarding commissions etc.

### Known limitations

- No push/email delivery provider wired (in-app only)
- Charts are card metrics; no heavy chart library dependency
- Multi-admin role matrix (content/finance/support) not split — single `admin` role
- Rate limiting relies on Supabase/Auth defaults

---

**PHASE 7 COMPLETE — READY FOR PHASE 8**

---

## Phase 8 – Mobile-first UI & production polish

### What improved

- **Bottom navigation (phone):** Home · Earn · Refer · Contact · More  
  Learning, Shop, Purchases, Games, Verification, Notifications, Profile, Settings, Admin live under **More**.
- **Touch targets:** larger nav items, modal close buttons, More sheet tiles.
- **Modals:** bottom-sheet style on phones, scrollable body, safe max height (`dvh`).
- **Currency:** shared `formatLkr()` → always `LKR 1,234.56` style where wired.
- **Dates:** shared `formatDateTime()` / `formatCountdown()` helpers.
- **Errors:** `friendlyError()` hides raw PostgREST/SQL messages from users.
- **Viewport / theme-color / apple-web-app** metadata for a more app-like browser experience.
- **Content padding** clears the fixed bottom nav + iOS safe area.

### No new database migration

Phase 8 is UI/UX only. Do **not** re-run SQL unless a previous migration was skipped.

### Mobile checklist (quick)

1. Phone browser → log in  
2. Bottom: Home, Earn, Refer, Contact, More  
3. More → Learning, Shop, Notifications, Settings  
4. Admin users: More → Admin or top bar shield  
5. Open a withdrawal / purchase modal → scroll and Close work  
6. Balances show as **LKR x,xxx.xx**

### Known limitations

- Not every historical money string may use `formatLkr` yet; primary wallet/earnings/admin analytics paths do.
- Full offline PWA service worker is intentionally **not** added (avoids cache/security complexity).

---

**PHASE 8 COMPLETE — READY FOR PHASE 9**
