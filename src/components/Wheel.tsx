"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Person = { id: string; username: string };

const R = 100;
const CENTER = 105; // small margin for stroke
const COLORS = ["#5aa24a", "#3f7a34"];

function polar(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: CENTER + radius * Math.cos(a), y: CENTER + radius * Math.sin(a) };
}

export function Wheel({ people }: { people: Person[] }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Person | null>(null);

  const n = people.length;
  const seg = n > 0 ? 360 / n : 0;

  const spin = () => {
    if (spinning || n === 0) return;
    const target = Math.floor(Math.random() * n);
    const winnerCenter = (target + 0.5) * seg; // degrees clockwise from top
    const currentMod = ((rotation % 360) + 360) % 360;
    const desiredMod = (360 - winnerCenter + 360) % 360;
    let delta = desiredMod - currentMod;
    if (delta < 0) delta += 360;
    const next = rotation + 360 * 5 + delta;
    setWinner(null);
    setSpinning(true);
    setRotation(next);
    // resolve winner when the transition completes
    window.setTimeout(() => {
      setSpinning(false);
      setWinner(people[target]);
    }, 4100);
  };

  if (n === 0) {
    return (
      <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-6 text-center text-sm text-muted">
        No CGLs on the hall yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: 210, height: 210 }}>
        {/* Pointer */}
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "16px solid #254c1e",
          }}
        />
        <div
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: "transform 4s cubic-bezier(0.15, 0.7, 0.1, 1)",
          }}
        >
          <svg viewBox="0 0 210 210" width="210" height="210">
            {people.map((p, i) => {
              // start at top (-90deg in SVG coords), go clockwise
              const a0 = -90 + i * seg;
              const a1 = -90 + (i + 1) * seg;
              const s = polar(a0, R);
              const e = polar(a1, R);
              const large = seg > 180 ? 1 : 0;
              const mid = -90 + (i + 0.5) * seg;
              const label = polar(mid, R * 0.62);
              const first = p.username.split(/\s+/)[0];
              return (
                <g key={p.id}>
                  <path
                    d={`M${CENTER},${CENTER} L${s.x},${s.y} A${R},${R} 0 ${large} 1 ${e.x},${e.y} Z`}
                    fill={COLORS[i % COLORS.length]}
                    stroke="#f3faef"
                    strokeWidth={1.5}
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${mid + 90} ${label.x} ${label.y})`}
                  >
                    {first}
                  </text>
                </g>
              );
            })}
            <circle cx={CENTER} cy={CENTER} r={14} fill="#254c1e" stroke="#f3faef" strokeWidth={2} />
          </svg>
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className={cn(
          "rounded-xl bg-flock-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-flock-800",
          spinning && "opacity-70",
        )}
      >
        {spinning ? "Spinning…" : "Spin the wheel"}
      </button>

      <div className="h-8 text-center">
        {winner && (
          <p className="text-lg font-bold text-flock-800">🎉 {winner.username}</p>
        )}
      </div>
    </div>
  );
}
