# Solstice — deployment guide (zero budget)

This is a real, deployable app: React + Vite frontend, Supabase for auth and database. Everything below uses free tiers — no card required anywhere in this sequence.

## What's in this project

```
solstice/
  src/
    components/
      Auth.jsx        — sign up / sign in
      DailyLog.jsx     — today's symptom entry form
      Arc.jsx          — the 30-day dawn-to-dusk visualization
      Insights.jsx     — rule-based pattern detection (no AI, no cost)
      DoctorReport.jsx — copyable visit-prep summary
    App.jsx            — tab layout, auth gating, data fetching
    supabaseClient.js   — Supabase connection (reads from .env)
    index.css           — all styling
  supabase/
    schema.sql          — run this once in Supabase to set up your database
  legal/
    PRIVACY_POLICY.md
    TERMS_OF_SERVICE.md
  .env.example
```

## Step 1 — Create a free Supabase project

1. Go to supabase.com and sign up (free, no card).
2. Create a new project. Pick any name and a strong database password (save it somewhere).
3. Once it's provisioned, go to **Project Settings > API**. Copy the **Project URL** and the **anon public** key.
4. In this project folder, copy `.env.example` to `.env` and paste those two values in.
5. Go to **SQL Editor > New query**, paste the entire contents of `supabase/schema.sql`, and run it. This creates the `logs` and `profiles` tables with row-level security, so each user can only ever see their own data.
6. In **Authentication > Providers**, email/password sign-up is on by default — nothing else to configure for the MVP. If you don't want the "confirm your email" step during early testing, you can turn off "Confirm email" under **Authentication > Settings** temporarily.

## Step 2 — Run it locally to confirm it works

```bash
npm install
npm run dev
```

Open the local URL it prints. Create an account, log a day, check the Arc and Patterns tabs.

## Step 3 — Deploy for free on Vercel

1. Push this folder to a GitHub repo (create a free GitHub account if you don't have one).
2. Go to vercel.com, sign up free with your GitHub account.
3. Click **New Project**, import the repo.
4. In the project's **Environment Variables** settings, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values from your `.env`.
5. Deploy. Vercel gives you a free `yourproject.vercel.app` URL — no domain purchase needed.

(Netlify or GitHub Pages work the same way if you prefer those instead.)

## Step 4 — Before you let anyone else use it

- Fill in the bracketed placeholders in `legal/PRIVACY_POLICY.md` and `legal/TERMS_OF_SERVICE.md`, and link them somewhere in the app (even a simple footer link is enough for early testing).
- Read the health-data note in the privacy policy — get a lawyer's read on your specific jurisdiction before taking payment or scaling past a small, consenting test group.
- Soft-launch to a handful of people first. The core question to validate: do people actually come back and log daily, and do they find the doctor report useful enough to bring to an appointment? That's the make-or-break signal before investing more time.

## What's intentionally left out of this zero-budget MVP

- **AI-generated reflections**: the earlier design included an optional call to Claude's API to turn patterns into a written summary. That's the one feature that costs money per use once you have real users, so it's left out here. If you want it back in later (once there's revenue or a testing budget), it's a small addition: one more Supabase Edge Function that calls the Anthropic API server-side, so your API key is never exposed in the frontend.
- **Payments**: no Stripe integration yet. Add this once you've validated people actually want to use it — Stripe is free to integrate and only takes a cut when money actually moves.
- **HIPAA/compliance infrastructure**: this MVP is architected reasonably (RLS, no third-party data sharing) but hasn't been through a compliance review. That's a "before you charge real money" step, not a "before you can test with friends" step.
