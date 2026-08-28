import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { COURSES } from "@/lib/course/catalog";
import { NYX, NYX_GALLERY, NYX_LOOKS } from "@/lib/course/instructor";
import { SKILLS } from "@/lib/course/skills";
import { requireAuthed } from "@/lib/session-page";

export default async function CourseIndexPage() {
  const { user, profile } = await requireAuthed();
  const clothedKeys = NYX_GALLERY.filter(
    (key) => !NYX_LOOKS.some((look) => look.sets.some((set) => set.key === key)),
  );
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
        <img src={NYX.portrait} alt={NYX.fullName} className="aspect-[2/3] w-full object-cover" />
        <figcaption className="bg-surface px-4 py-3 text-sm text-muted">
          {NYX.fullName}, {NYX.ageLabel}. {NYX.look}
        </figcaption>
      </figure>
      <div className="mt-6 space-y-6">
        {NYX_LOOKS.map((look) => (
          <section key={look.id}>
            <h2 className="text-xs uppercase tracking-[0.16em] text-copper">{look.label}</h2>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {look.sets.map((set) => (
                <figure key={set.key}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={NYX.photos[set.key]}
                    alt={`${NYX.name} ${look.label} ${set.label}`}
                    className="aspect-[2/3] w-full rounded-2xl border border-line object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                  <figcaption className="mt-1 text-[11px] text-muted">{set.label}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
      <details className="mt-4 rounded-3xl border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm text-muted">Stage stills (sports-bra wardrobe)</summary>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {clothedKeys.map((key) => (
            <figure key={key}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={NYX.photos[key]}
                alt={`${NYX.name} ${key} still`}
                className="aspect-[2/3] w-full rounded-2xl border border-line object-cover"
                loading="lazy"
                decoding="async"
              />
            </figure>
          ))}
        </div>
      </details>
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
