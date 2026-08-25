import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SkillLesson } from "@/components/skill-lesson";
import { courseById } from "@/lib/course/catalog";
import { skillById } from "@/lib/course/skills";
import { requireAuthed } from "@/lib/session-page";

export default async function SkillPage({
  params,
}: {
  params: Promise<{ courseId: string; skillId: string }>;
}) {
  const { courseId, skillId } = await params;
  const { user, profile } = await requireAuthed();
  const course = courseById(courseId);
  const skill = skillById(skillId);
  if (!course || !skill) notFound();
  if (!course.modules.some((m) => m.skillIds.includes(skill.id))) notFound();
  const courseModule = course.modules.find((m) => m.skillIds.includes(skill.id));
  const index = courseModule ? courseModule.skillIds.indexOf(skill.id) : -1;
  const prevId = courseModule && index > 0 ? courseModule.skillIds[index - 1] : undefined;
  const nextId = courseModule && index >= 0 ? courseModule.skillIds[index + 1] : undefined;

  return (
    <AppShell user={user} profile={profile}>
      <Link href={`/course/${course.id}`} className="text-sm text-copper-2">
        {course.name}
      </Link>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-copper">
        {courseModule?.title ?? skill.module} · {skill.level} · {skill.durationLabel}
      </p>
      <h1 className="display mt-1 text-4xl">{skill.name}</h1>
      <p className="mt-3 text-muted">{skill.why}</p>
      <div className="mt-8">
        <SkillLesson skill={skill} />
      </div>
      <div className="mt-8 flex flex-wrap justify-between gap-3 text-sm text-copper-2">
        {prevId ? (
          <Link href={`/course/${course.id}/${prevId}`}>← Previous</Link>
        ) : (
          <Link href={`/course/${course.id}`}>← Module list</Link>
        )}
        {nextId ? (
          <Link href={`/course/${course.id}/${nextId}`}>Next skill →</Link>
        ) : (
          <Link href={`/course/${course.id}`}>Back to course</Link>
        )}
      </div>
    </AppShell>
  );
}
