import { requireActiveUser } from "@/lib/auth";
import {
  getLeaderVerses,
  getGroupVerses,
  getStudentVerses,
  getMyLedGroup,
} from "@/lib/verses";
import {
  addLeaderVerseAction,
  addGroupVerseAction,
} from "@/lib/actions/verses";
import { VerseList } from "@/components/VerseList";
import { VerseManager } from "@/components/VerseManager";

export default async function VersePage() {
  const user = await requireActiveUser();

  // --- Student: the verses their CGL set for the group ---
  if (user.role === "MEMBER") {
    const verses = await getStudentVerses(user);
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-flock-800">Memory Verses</h1>
          <p className="text-sm text-muted">From your CGL — memorize these.</p>
        </div>
        <VerseList
          verses={verses}
          emptyText={
            user.groupId
              ? "Your CGL hasn't set any verses yet."
              : "You're not in a group yet — your RS will place you."
          }
        />
      </section>
    );
  }

  // --- RS: manage the verses for the hall's CGLs ---
  if (user.role === "ADMIN") {
    const verses = await getLeaderVerses(user);
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-flock-800">Memory Verses</h1>
          <p className="text-sm text-muted">
            Set the verses for your CGLs to memorize.
          </p>
        </div>
        <VerseManager
          verses={verses}
          addAction={addLeaderVerseAction}
          emptyText="No verses for your CGLs yet."
        />
      </section>
    );
  }

  // --- CGL: memorize the RS's verses + set their group's verses ---
  const led = await getMyLedGroup(user);
  const [leaderVerses, groupVerses] = await Promise.all([
    getLeaderVerses(user),
    led ? getGroupVerses(user, led.id) : Promise.resolve([]),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-flock-800">Memory Verses</h1>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          For you to memorize
        </h2>
        <VerseList
          verses={leaderVerses}
          emptyText="Your RS hasn't set any verses yet."
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Your group&apos;s verses
        </h2>
        {led ? (
          <VerseManager
            verses={groupVerses}
            addAction={addGroupVerseAction}
            groupId={led.id}
            emptyText="Set a verse for your guys to memorize."
          />
        ) : (
          <p className="text-sm text-muted">
            You&apos;re not leading a group yet.
          </p>
        )}
      </div>
    </section>
  );
}
