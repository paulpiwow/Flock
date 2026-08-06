import { redirect } from "next/navigation";
import { requireActiveUser } from "@/lib/auth";
import { getHallCGLs } from "@/lib/groups";
import { Wheel } from "@/components/Wheel";

export default async function PickerPage() {
  const user = await requireActiveUser();
  // RS and CGLs can spin; students don't need it.
  if (user.role === "MEMBER") redirect("/home");

  const cgls = await getHallCGLs(user);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-flock-800">CGL Picker</h1>
        <p className="text-sm text-muted">
          Who prays, who grabs snacks, who shares first?
        </p>
      </div>
      <Wheel people={cgls} />
    </section>
  );
}
