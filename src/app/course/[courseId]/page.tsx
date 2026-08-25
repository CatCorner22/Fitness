import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { enrollProgramAction } from "@/app/actions/profile";
import { courseById, skillsInCourse } from "@/lib/course/catalog";
import { NYX } from "@/lib/course/instructor";
import { skillById } from "@/lib/course/skills";
import { requireAuthed } from "@/lib/session-page";

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const { user, profile } = await requireAuthed();
  const course = courseById(courseId);
  if (!course) notFound();
  const skills = skillsInCourse(course.id);

  return (
    <AppShell user={user} profile={profile}>
      <Link href="/course" className="text-sm text-copper-2">
        All courses
      </Link>
      <h1 className="display mt-3 text-4xl">{course.name}</h1>
      <p className="mt-2 text-muted">{course.tagline}</p>
      <p className="mt-4 text-sm">{course.description}</p>
      {course.adult ? (
        <p className="mt-3 text-xs text-copper-2">
          Adult stage-craft. {NYX.name} is a smoky-eyed, alluring goth instructor — same woman on the photos, plates,
          and clips.
        </p>
      ) : null}
      <form action={enrollProgramAction.bind(null, course.programId)} className="mt-6">
        <button className="btn-primary" type="submit">
          Use this as my plan
        </button>
      </form>
      <h2 className="mt-8 text-sm uppercase tracking-[0.16em] text-copper">How to learn</h2>
      <ol className="mt-3 space-y-2 text-sm">
        {course.howToLearn.map((line, i) => (
          <li key={line} className="flex gap-3">
            <span className="text-copper-2">{i + 1}.</span>
            {line}
          </li>
        ))}
      </ol>
      <div className="mt-10 space-y-8">
        {course.modules.map((mod) => (
          <section key={mod.id} className="rounded-3xl border border-line bg-surface p-6">
            <h2 className="display text-2xl">{mod.title}</h2>
            <p className="text-sm text-muted">
              {mod.weeks} · {mod.intent}
            </p>
            <ul className="mt-4 space-y-3">
              {mod.skillIds.map((id) => {
                const skill = skillById(id);
                if (!skill) return null;
                return (
                  <li key={id}>
                    <Link href={`/course/${course.id}/${skill.id}`} className="block rounded-2xl bg-bg-2 p-4">
                      <span className="font-semibold">{skill.name}</span>
                      <span className="mt-1 block text-sm text-copper-2">{skill.cue}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {skill.durationLabel} · {skill.steps.length} steps · Watch / With Nyx / Your turn
                      </span>
                      {skill.passWhen ? (
                        <span className="mt-2 block text-xs text-muted">Move on when: {skill.passWhen}</span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">{skills.length} skills in this course. None omitted.</p>
    </AppShell>
  );
}
