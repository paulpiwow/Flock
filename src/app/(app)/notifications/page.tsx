import { requireActiveUser } from "@/lib/auth";
import { NotificationsToggle } from "@/components/NotificationsToggle";

export default async function NotificationsPage() {
  await requireActiveUser();
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">Notifications</h1>
        <p className="text-sm text-muted">
          Turn push notifications on or off for this device.
        </p>
      </div>
      <NotificationsToggle variant="settings" />
    </section>
  );
}
