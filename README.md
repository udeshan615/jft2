# Nihongo Rewards – Japanese Learning & Rewards Platform

**Phase 1 Foundation** – Authentication, roles, database schema, design system, navigation, admin panel structure.

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
