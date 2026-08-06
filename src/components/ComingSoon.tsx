import { SheepMark } from "@/components/SheepMark";

export function ComingSoon({
  title,
  phase,
  blurb,
}: {
  title: string;
  phase?: string;
  blurb?: string;
}) {
  return (
    <section className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-flock-100 text-flock-700">
        <SheepMark className="h-8 w-8" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-flock-800">{title}</h1>
      {blurb && <p className="mt-2 max-w-xs text-sm text-muted">{blurb}</p>}
      <span className="mt-4 rounded-full bg-flock-100 px-3 py-1 text-xs font-medium text-flock-700">
        {phase ?? "Coming soon"}
      </span>
    </section>
  );
}
