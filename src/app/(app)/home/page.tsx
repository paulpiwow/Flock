import { requireActiveUser } from "@/lib/auth";
import { HOME_TILES } from "@/lib/features";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { FeatureGrid } from "@/components/FeatureGrid";
import { SheepMark } from "@/components/SheepMark";
import { SignOutButton } from "@/components/SignOutButton";

export default async function HomePage() {
  const user = await requireActiveUser();
  const role = user.role as Role;
  const initial = user.username.charAt(0).toUpperCase();

  return (
    <section className="space-y-6">
      {/* Top bar: brand + sign out */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-flock-800">
          <SheepMark className="h-6 w-6" />
          <span className="text-lg font-bold tracking-tight">Flock</span>
        </div>
        <SignOutButton />
      </div>

      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-flock-700 text-lg font-bold text-white">
          {initial}
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Hey, {user.username}
          </h1>
          <p className="text-sm text-muted">
            {ROLE_LABEL[role]} · {user.hall.name}
          </p>
        </div>
      </div>

      {/* Launcher grid */}
      <FeatureGrid tiles={HOME_TILES[role]} />
    </section>
  );
}
