import { notFound } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { getStudentCareNotes } from "@/lib/care";
import { CareTimeline } from "@/components/CareTimeline";
import { CareNoteForm } from "@/components/CareNoteForm";

export default async function StudentCarePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const user = await requireActiveUser();
  if (user.role === "MEMBER") notFound();

  const { studentId } = await params;

  let data;
  try {
    data = await getStudentCareNotes(user, studentId);
  } catch {
    // Not on this hall / not in this CGL's group → 404 (don't leak existence).
    notFound();
  }
  const { student, notes } = data;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">{student.username}</h1>
        <p className="text-sm text-muted">
          {notes.length} note{notes.length === 1 ? "" : "s"} this semester
        </p>
      </div>

      <CareNoteForm studentId={student.id} />
      <CareTimeline notes={notes} />
    </section>
  );
}
