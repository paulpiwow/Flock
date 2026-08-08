import { requireActiveUser } from "@/lib/auth";
import { getPrayerData, type PrayerItem } from "@/lib/prayer";
import { PrayerRequestForm } from "@/components/PrayerRequestForm";

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function RequestList({
  items,
  showAuthor,
  empty,
}: {
  items: PrayerItem[];
  showAuthor: boolean;
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-6 text-center text-sm text-muted">
        {empty}
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li
          key={r.id}
          className="rounded-card border border-border bg-surface p-4 shadow-sm"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">
              {showAuthor ? r.author : "You"}
            </span>
            <span className="text-xs text-muted">{fmtDate(r.createdAt)}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{r.body}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function PrayerPage() {
  const user = await requireActiveUser();
  const { sendTo, received, sent } = await getPrayerData(user);

  // --- RS: read-only inbox of their CGLs' requests ---
  if (user.role === "ADMIN") {
    return (
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-flock-800">Prayer Requests</h1>
          <p className="text-sm text-muted">From your CGLs</p>
        </div>
        <RequestList
          items={received}
          showAuthor
          empty="No prayer requests from your CGLs yet."
        />
      </section>
    );
  }

  // --- CGL: their guys' requests + send one up to the RS ---
  if (user.role === "LEADER") {
    return (
      <section className="space-y-6">
        <h1 className="text-xl font-bold text-flock-800">Prayer Requests</h1>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            From your guys
          </h2>
          <RequestList
            items={received}
            showAuthor
            empty="No prayer requests from your guys yet."
          />
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            Send a request up
          </h2>
          <PrayerRequestForm sendTo={sendTo ?? "your RS"} />
        </div>

        {sent.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              Sent to your RS
            </h2>
            <RequestList items={sent} showAuthor={false} empty="" />
          </div>
        )}
      </section>
    );
  }

  // --- Student: send a request to their CGL + see what they've sent ---
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-flock-800">Prayer Requests</h1>
        <p className="text-sm text-muted">
          Send a request to {sendTo ?? "your CGL"}
        </p>
      </div>

      <PrayerRequestForm sendTo={sendTo ?? "your CGL"} />

      <div>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Your requests
        </h2>
        <RequestList
          items={sent}
          showAuthor={false}
          empty="You haven't sent any prayer requests yet."
        />
      </div>
    </section>
  );
}
