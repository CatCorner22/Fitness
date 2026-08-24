# Garanimal

A private, two-user web app for evidence-based strength training and simple nutrition. Built for a household, not a marketplace.

## What it does

- Two isolated logins (`alex` / `household` and `jordan` / `household`)
- Eight full programs: powerlifting, Westside-inspired conjugate, classic bodybuilding split, PPL, upper/lower, strength + endurance, pole & stage prep, and the Big Ass Program
- Session length budgets that keep compounds and drop isolation
- Set RPE (Helms–Zourdos RIR scale) plus session RPE
- Inspectable load suggestions and weekly volume vs MEV / MAV / MRV landmarks
- Safety registry that never prescribes bench dips, behind-the-neck presses/pulldowns, chin-height upright rows, or kipping pull-ups
- Scientist or **Garanimal** coach voice (Goggins-grade accountability with injury rails)
- Day-at-a-glance nutrition, protein targets, optional adaptive calories from weigh-ins
- Progress charts and CSV export

## Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). SQLite lives in `data/garanimal.db` and is created on first boot.

Copy `.env.example` to `.env.local` and set `AUTH_SECRET` before deploying.

## Stack

Next.js App Router, TypeScript, Tailwind, Drizzle, better-sqlite3, jose sessions.

The plan mentioned Neon Postgres. This household build uses local SQLite so it runs without cloud credentials. The schema is portable.

## Not medical advice

If a movement is sharp, hot, or numb, stop. The coach is not allowed to tell you otherwise.
