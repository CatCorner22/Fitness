import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { courseForProgram } from "@/lib/course/catalog";
import { lessonForExercise } from "@/lib/course/skills";
import { getExercise } from "@/lib/exercises/registry";
import { getProgram } from "@/lib/programs/catalog";
import { requireAuthed } from "@/lib/session-page";

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, profile } = await requireAuthed();
  const program = getProgram(id);
  if (!program) notFound();
  const course = courseForProgram(program.id);
  const lessonCtx = course
    ? { courseId: course.id, skillIds: course.modules.flatMap((m) => m.skillIds) }
    : undefined;

  return (
    <AppShell user={user} profile={profile}>
      <p className="text-xs uppercase tracking-[0.16em] text-copper">{program.category}</p>
      <h1 className="display text-4xl">{program.name}</h1>
      <p className="mt-2 max-w-2xl text-muted">{program.description}</p>
      {course ? (
        <Link href={`/course/${course.id}`} className="mt-3 inline-block text-sm text-copper-2">
          Open Nyx course (cue, steps, diagram, photo, voice, video) →
        </Link>
      ) : null}
      <div className="mt-6 space-y-3">
        {program.phases.map((phase) => (
          <p key={phase.name} className="text-sm">
            <span className="text-copper-2">Weeks {phase.weeks.join(", ")} · {phase.name}.</span>{" "}
            {phase.note}
          </p>
        ))}
      </div>
      <div className="mt-8 space-y-6">
        {program.days.map((day) => (
          <section key={day.id} className="rounded-3xl border border-line bg-surface p-6">
            <h2 className="display text-2xl">{day.name}</h2>
            <p className="text-sm text-muted">{day.focus}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {day.exercises.map((item, idx) => {
                const ex = getExercise(item.exerciseId);
                const lesson = lessonForExercise(item.exerciseId, lessonCtx);
                return (
                  <li key={`${item.exerciseId}-${idx}`} className="flex justify-between gap-4 border-b border-line/50 py-2">
                    <span>
                      {ex?.name ?? item.exerciseId}
                      {lesson ? (
                        <Link href={lesson.href} className="ml-2 text-xs text-copper-2">
                          How
                        </Link>
                      ) : null}
                      <span className="block text-xs text-muted">{item.notes}</span>
                    </span>
                    <span className="text-muted">
                      {item.sets} × {item.reps} @ RPE {item.targetRpe}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </AppShell>
  );
}