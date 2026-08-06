// When student self-check-in is open. Scheduled window: Wednesdays 10pm–midnight
// Eastern Time (Liberty = Virginia). Computed in ET so it's correct on a UTC server.

const TZ = "America/New_York";
const OPEN_WEEKDAY = "Wed";
const OPEN_HOUR = 22; // 10pm
const CLOSE_HOUR = 24; // midnight (exclusive)

export const CHECK_IN_OPENS_TEXT = "Check-in opens Wednesday at 10pm";

/** Is student check-in currently open? */
export function isCheckInOpen(now: Date = new Date()): boolean {
  // Dev-only escape hatch for testing the open state off-schedule.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.CHECKIN_ALWAYS_OPEN === "true"
  ) {
    return true;
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value;
  let hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  if (hour === 24) hour = 0; // some runtimes render midnight as "24"

  return weekday === OPEN_WEEKDAY && hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}
