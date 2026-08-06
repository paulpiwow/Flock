import { requireActiveUser } from "@/lib/auth";
import { Taskbar } from "@/components/Taskbar";
import type { Role } from "@/lib/roles";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireActiveUser();

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Content area; pad the bottom so nothing hides behind the taskbar. */}
      <div className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-4">
        {children}
      </div>
      <Taskbar role={user.role as Role} />
    </div>
  );
}
