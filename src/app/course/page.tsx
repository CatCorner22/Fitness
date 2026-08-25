import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { COURSES } from "@/lib/course/catalog";
import { NYX } from "@/lib/course/instructor";
import { SKILLS } from "@/lib/course/skills";
import { requireAuthed } from "@/lib/session-page";

export default async function CourseIndexPage() {
  const { user, profile } = await requireAuthed();
  return (
    <AppShell user={user} profile={profile}>
      <p className="text-xs uppercase tracking-[0.16em] text-copper">{NYX.role}</p>
      <h1 className="display text-4xl">Nyx courses</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Multiple ways in: Watch me, With Nyx, or Your turn — cue, one step at a time, diagram, a sexy smoky-eyed
        photo, editorial plate, sultry voice with the words on screen, video. Pick the channel that lands. Skip the rest. Nothing in a
        module is hidden.
      </p>
      <figure className="mt-6 overflow-hidden rounded-3xl border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={NYX.portrait} alt={NYX.fullName} className="w-full" />
        <figcaption className="bg-surface px-4 py-3 text-sm text-muted">
          {NYX.fullName}, {NYX.ageLabel}. {NYX.look}
        </figcaption>
      </figure>
      <div className="mt-8 space-y-4">
        {COURSES.map((course) => (
          <article key={course.id} className="rounded-3xl border border-line bg-surface p-6">
            <h2 className="display text-3xl">{course.name}</h2>
            <p className="mt-1 text-muted">{course.tagline}</p>
            <p className="mt-3 text-sm">{course.description}</p>
            <ol className="mt-4 space-y-2">
              {course.modules.map((mod) => (
                <li key={mod.id} className="rounded-2xl bg-bg-2 p-3 text-sm">
                  <strong>{mod.title}</strong>
                  <span className="block text-xs text-muted">
                    {mod.weeks} · {mod.skillIds.length} skills ·{" "}
                    {mod.skillIds.map((id) => SKILLS.find((s) => s.id === id)?.name ?? id).join(" · ")}
                  </span>
                </li>
              ))}
            </ol>
            <Link href={`/course/${course.id}`} className="mt-4 inline-block text-sm text-copper-2">
              Open full course →
            </Link>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
