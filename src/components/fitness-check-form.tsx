import { saveAssessmentAction } from "@/app/actions/assessment";
import { FieldTimer } from "@/components/field-timer";

export function FitnessCheckForm({
  submitLabel,
  skipLabel,
}: {
  submitLabel: string;
  skipLabel: string;
}) {
  return (
    <form action={saveAssessmentAction} className="space-y-8">
      <p className="text-sm text-muted">
        Stop for chest pain, dizziness, fainting, or anything sharp, hot, or numb. This is not a VO2 max lab, a 1RM
        meet, or medical clearance.
      </p>

      <label className="flex min-h-12 items-start gap-3 text-sm">
        <input type="checkbox" name="parqStop" value="1" className="mt-1 w-auto" />
        <span>A clinician told me not to exercise, or I have chest pain / unexplained dizziness. Skip the tests.</span>
      </label>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Aerobic</h2>
        <p className="text-sm text-muted">
          ATS 6-minute walk (how far in 6 minutes, no running required) or the Rikli &amp; Jones 2-minute in-place
          step. Pick one.
        </p>
        <div className="grid gap-2">
          {[
            ["walk6", "6-minute walk"],
            ["step2", "2-minute step-in-place"],
            ["skip", "Skip this one"],
          ].map(([value, label]) => (
            <label key={value} className="flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-surface px-4">
              <input type="radio" name="aerobicMode" value={value} defaultChecked={value === "walk6"} className="w-auto" />
              {label}
            </label>
          ))}
        </div>
        <label className="block text-sm text-muted">
          Walk distance (meters)
          <input name="walkMeters" type="number" min={0} step={1} placeholder="e.g. 520" className="mt-1" />
        </label>
        <p className="text-xs text-muted">Or count laps: laps × length of your loop.</p>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-muted">
            Laps
            <input name="walkLaps" type="number" min={0} step={1} className="mt-1" />
          </label>
          <label className="block text-sm text-muted">
            Loop meters
            <input name="walkLapMeters" type="number" min={0} step={1} placeholder="30" className="mt-1" />
          </label>
        </div>
        <FieldTimer name="unused-walk-clock" seconds={360} label="6-minute clock (optional)" />
        <label className="block text-sm text-muted">
          Step-in-place count (2 minutes)
          <input name="stepCount" type="number" min={0} step={1} className="mt-1" />
        </label>
        <FieldTimer name="unused-step-clock" seconds={120} label="2-minute clock (optional)" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Push-ups</h2>
        <p className="text-sm text-muted">
          CSEP-PATH / ACSM: as many good reps as you can. Men usually from the toes; the published women&apos;s table
          uses knees. Record which you did. Stop when form breaks.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex min-h-12 items-center justify-center rounded-2xl border border-line bg-surface has-[:checked]:border-copper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--copper)]">
            <input type="radio" name="pushupStyle" value="toes" defaultChecked className="sr-only" />
            Toes
          </label>
          <label className="flex min-h-12 items-center justify-center rounded-2xl border border-line bg-surface has-[:checked]:border-copper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--copper)]">
            <input type="radio" name="pushupStyle" value="knees" className="sr-only" />
            Knees
          </label>
        </div>
        <label className="block text-sm text-muted">
          Reps
          <input name="pushups" type="number" min={0} step={1} className="mt-1" />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. 30-second chair stand</h2>
        <p className="text-sm text-muted">
          Senior Fitness Test (Rikli &amp; Jones): arms crossed, stand and sit as many times as you can in 30 seconds.
          Chair against a wall. Works as a lower-body screen at any age.
        </p>
        <FieldTimer name="unused-chair-clock" seconds={30} label="30-second clock" />
        <label className="block text-sm text-muted">
          Stands
          <input name="chairStand" type="number" min={0} step={1} className="mt-1" />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Front plank</h2>
        <p className="text-sm text-muted">
          Hold a rigid plank until hips sag or you stop. Sit-ups are a worse spine test (McGill). Strand 2014 published
          plank norms; ~2 minutes is a strong adult target, not a personality.
        </p>
        <FieldTimer name="plankSeconds" seconds={180} label="Plank timer — stop writes the seconds" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">5. Single-leg stance</h2>
        <p className="text-sm text-muted">
          Springer 2007 unipedal stance: eyes open, arms crossed, one foot off the floor. Stop at 45 seconds or when you
          put the foot down.
        </p>
        <FieldTimer name="singleLegSeconds" seconds={45} label="Balance timer" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">6. Mobility screens</h2>
        <p className="text-sm text-muted">
          Not a certified FMS. Overhead squat quality plus the Senior Fitness Test back-scratch (Apley).
        </p>
        <fieldset className="space-y-2">
          <legend className="text-sm text-muted">Overhead squat to parallel, arms up</legend>
          {[
            ["3", "Arms stay up, hips below parallel-ish, no pain"],
            ["2", "I get down but arms fall or knees cave hard"],
            ["1", "I can't get there"],
          ].map(([value, label]) => (
            <label key={value} className="flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-surface px-4 text-sm">
              <input type="radio" name="squatQuality" value={value} className="w-auto" />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm text-muted">Back-scratch: one hand over, one under</legend>
          {[
            ["3", "Fingers overlap or touch"],
            ["2", "Close — a few centimeters short"],
            ["1", "Nowhere near"],
          ].map(([value, label]) => (
            <label key={value} className="flex min-h-12 items-center gap-3 rounded-2xl border border-line bg-surface px-4 text-sm">
              <input type="radio" name="shoulderReach" value={value} className="w-auto" />
              {label}
            </label>
          ))}
        </fieldset>
      </section>

      <button className="btn-primary" type="submit">
        {submitLabel}
      </button>
      <button className="btn-quiet" type="submit" name="skipAll" value="1">
        {skipLabel}
      </button>
    </form>
  );
}
