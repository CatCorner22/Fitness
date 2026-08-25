# Garanimal

A private, two-user web app for evidence-based strength training and simple nutrition. Built for a household, not a marketplace.

## What it does

- Two isolated logins (`alex` / `household` and `jordan` / `household`)
- Fourteen programs: powerlifting, conjugate, bodybuilding split, PPL, upper/lower, strength + endurance, pole class prep, amateur night, yoga, stretch, barre, ballet, rucking, and the Big Ass Program
- Every listed drill stays in the session — the clock never deletes work
- Set RPE (Helms–Zourdos RIR scale) plus session RPE
- Safety registry that never prescribes bench/chair/parallel-bar dips, behind-the-neck presses/pulldowns, chin-height upright rows, or kipping pull-ups
- Scientist or **Garanimal** coach voice (Goggins-grade accountability with injury rails)
- Day-at-a-glance nutrition, protein targets, optional adaptive calories from weigh-ins
- Progress charts and CSV export

## Run it locally

```bash
npm install
cp .env.example .env.local
# set AUTH_SECRET to a long random string
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). SQLite lives in `data/garanimal.db` and is created on first boot. Node 20+ is required.

Set `TZ` (for example `America/Chicago`) if the machine's timezone is not the household's. "Today" follows the process timezone.

## Replit

1. Import the GitHub repo. Replit picks up `.replit` (`npm run dev` on `0.0.0.0`) and `replit.nix` (gcc/python so `better-sqlite3` can compile).
2. Add Secrets: `AUTH_SECRET` (32+ random characters). Optional: `TZ`, `AI_GATEWAY_API_KEY`.
3. Press Run. Preview uses `*.replit.dev`; session cookies use `SameSite=None; Secure` so the IDE iframe keeps the login.
4. Health check: `/api/health` (no login).

`data/garanimal.db` persists on the Replit workspace disk (it is gitignored). **Publish on Autoscale / Cloud Run wipes that disk on restart.** Deploy with a **Reserved VM**, or keep using the always-on workspace. Do not migrate this household app to Postgres unless you mean to.

If the native SQLite module fails to load after a Nix change, run `npm rebuild better-sqlite3`.

## Stack

Next.js App Router, TypeScript, Tailwind, Drizzle, better-sqlite3, jose sessions.

The plan mentioned Neon Postgres. This household build uses local SQLite so it runs without cloud credentials. The schema is portable.

## Not medical advice

If a movement is sharp, hot, or numb, stop. The coach is not allowed to tell you otherwise.
