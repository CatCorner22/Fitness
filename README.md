# Garanimal

A private, two-user web app for evidence-based strength training and simple nutrition. Built for a household, not a marketplace.

## What it does

- Two isolated logins, `alex` and `jordan`. First-boot passwords come from `GARANIMAL_ALEX_PASSWORD` / `GARANIMAL_JORDAN_PASSWORD` (or `GARANIMAL_HOUSEHOLD_PASSWORD`), default `household` for local dev; each person changes theirs under You. Login is throttled (10 failures per 15 minutes per address and per username).
- Fourteen programs: powerlifting, conjugate, bodybuilding split, PPL, upper/lower, strength + endurance, pole class prep, amateur night, yoga, stretch, barre, ballet, rucking, and the Big Ass Program
- Every listed drill stays in the session — the clock never deletes work
- Set RPE (Helms–Zourdos RIR scale) plus session RPE
- Safety registry that never prescribes bench/chair/parallel-bar dips, behind-the-neck presses/pulldowns, chin-height upright rows, or kipping pull-ups
- Scientist or **Garanimal** coach voice (Goggins-grade accountability with injury rails)
- **Pioneer**: a one-way draft observer for training and food notes — local instruments always, a constrained model only when you opt in. It never edits the page.
- Day-at-a-glance nutrition, protein targets, optional adaptive calories from weigh-ins
- **Meal plan** (`/meal-plan`): one question — get leaner, recomp, maintain, or gain mass — sets the calorie direction, protein and fat targets, per-meal protein, and which plates rotate through a 7-day plan with a grocery list. Filters by dietary pattern (omnivore, pescatarian, vegetarian, vegan) and low-histamine blocks. Every number is tied to a peer-reviewed US source (Mifflin-St Jeor, ISSN position stands, Helms, Iraki, Murphy & Koehler, Schoenfeld & Aragon, Mamerow, Barakat, IOM DRIs, Dietary Guidelines for Americans) listed on the page.
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

## Checks before you ship

```bash
npm run check   # lint + typecheck + every assert suite
npm run build   # production build (also runs TypeScript)
```

`npm run check` runs `eslint`, `next typegen && tsc --noEmit`, and the assertion suites: `assert:programs` (no truncated programs), `assert:daily-use` (units, copy-meals, rest, env docs), `assert:pioneer`, and `assert:meal-plan` (evidence registry, body-fat bands, lean/gain targets and guards, progress verdicts, dietary-pattern filtering, plate scaling at lean/gain/floor targets, weekly rotation and grocery totals, page wiring).

Production smoke test:

```bash
DATABASE_PATH=/tmp/smoke/garanimal.db AUTH_SECRET=<32+ chars> npm run build && npm start
curl -s localhost:3000/api/health   # {"ok":true,...,"db":{"ok":true,"journalMode":"wal"}}
```

`/api/health` opens the database, runs a read, and verifies the profile schema is current. It returns HTTP 503 with a reason if any of that fails, so point your uptime monitor at it.

Serving a production build over plain `http://` on the home network (no TLS)? Set `GARANIMAL_ALLOW_INSECURE_COOKIE=1`, otherwise browsers drop the `Secure` session cookie and login loops. Never set it on a public host.

## Replit

1. Import the GitHub repo. Replit picks up `.replit` (`npm run dev` on `0.0.0.0`) and `replit.nix` (gcc/python so `better-sqlite3` can compile).
2. Add Secrets: `AUTH_SECRET` (32+ random characters) and `GARANIMAL_HOUSEHOLD_PASSWORD` (or per-user `GARANIMAL_ALEX_PASSWORD` / `GARANIMAL_JORDAN_PASSWORD`) before the first run — the deployment URL is public. Optional: `TZ`, `AI_GATEWAY_API_KEY` (Spirit + Pioneer).
3. Press Run. Preview uses `*.replit.dev`; session cookies use `SameSite=None; Secure` so the IDE iframe keeps the login.
4. Health check: `/api/health` (no login). 200 means the app and SQLite are up; 503 means the database could not be opened or migrated.

`data/garanimal.db` persists on the Replit workspace disk (it is gitignored). **Publish on Autoscale / Cloud Run wipes that disk on restart.** Deploy with a **Reserved VM**, or keep using the always-on workspace. Do not migrate this household app to Postgres unless you mean to.

If the native SQLite module fails to load after a Nix change, run `npm rebuild better-sqlite3`.

## Stack

Next.js App Router, TypeScript, Tailwind, Drizzle, better-sqlite3, jose sessions.

The plan mentioned Neon Postgres. This household build uses local SQLite so it runs without cloud credentials. The schema is portable.

## Not medical advice

If a movement is sharp, hot, or numb, stop. The coach is not allowed to tell you otherwise.
