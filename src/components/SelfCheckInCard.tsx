"use client";

import { useFormStatus } from "react-dom";
import { Check, Clock } from "lucide-react";
import { selfCheckInAction } from "@/lib/actions/attendance";
import { CHECK_IN_OPENS_TEXT } from "@/lib/checkin";

function CheckInButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-flock-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-flock-800 disabled:opacity-70"
    >
      {pending ? "Checking in…" : "I'm here"}
    </button>
  );
}

type Props = {
  passageRef: string;
  groupName: string | null;
  leaderName: string | null;
  hasGroup: boolean;
  open: boolean;
  selfReported: boolean;
  confirmedStatus: "PRESENT" | "ABSENT" | "EXCUSED" | null;
};

export function SelfCheckInCard({
  passageRef,
  groupName,
  leaderName,
  hasGroup,
  open,
  selfReported,
  confirmedStatus,
}: Props) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-flock-600">
        This Wednesday
      </p>
      <h2 className="mt-1 text-lg font-bold text-foreground">{passageRef}</h2>
      {groupName && (
        <p className="mt-0.5 text-sm text-muted">
          {groupName}
          {leaderName ? ` · led by ${leaderName}` : ""}
        </p>
      )}

      <div className="mt-4">
        {confirmedStatus === "PRESENT" ? (
          <div className="flex items-center gap-2 rounded-xl bg-flock-100 px-4 py-3 text-sm font-semibold text-flock-800">
            <Check className="h-4 w-4" aria-hidden /> Marked present
          </div>
        ) : confirmedStatus === "ABSENT" ? (
          <div className="rounded-xl bg-flock-50 px-4 py-3 text-sm font-medium text-muted">
            Marked absent by your CGL.
          </div>
        ) : selfReported ? (
          <div className="flex items-center gap-2 rounded-xl bg-flock-100 px-4 py-3 text-sm font-semibold text-flock-800">
            <Check className="h-4 w-4" aria-hidden /> You&apos;re checked in —
            your CGL will confirm.
          </div>
        ) : !hasGroup ? (
          <div className="rounded-xl bg-flock-50 px-4 py-3 text-sm font-medium text-muted">
            You&apos;re not in a group yet — your RS will place you into a
            Community Group.
          </div>
        ) : open ? (
          <form action={selfCheckInAction}>
            <CheckInButton />
          </form>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-flock-50 px-4 py-3 text-sm font-medium text-muted">
            <Clock className="h-4 w-4" aria-hidden /> {CHECK_IN_OPENS_TEXT}
          </div>
        )}
      </div>
    </div>
  );
}
