// Self-contained SVG line/area chart of weekly attendance %. No chart library.

type Point = { label: string; pct: number };

export function AttendanceChart({ data }: { data: Point[] }) {
  const W = 320;
  const H = 160;
  const padX = 28;
  const padTop = 24;
  const padBottom = 24;
  const chartW = W - padX * 2;
  const chartH = H - padTop - padBottom;

  if (data.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-border bg-flock-50 px-4 py-6 text-center text-sm text-muted">
        No weeks yet.
      </p>
    );
  }

  const n = data.length;
  const x = (i: number) => padX + (n === 1 ? chartW / 2 : (chartW * i) / (n - 1));
  const y = (pct: number) => padTop + chartH * (1 - pct / 100);

  const linePts = data.map((d, i) => `${x(i)},${y(d.pct)}`).join(" ");
  const areaPts = `${padX},${padTop + chartH} ${linePts} ${x(n - 1)},${padTop + chartH}`;

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface p-3 shadow-sm">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Weekly attendance">
        {/* gridlines at 50% and 100% */}
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line
              x1={padX}
              x2={W - padX}
              y1={y(g)}
              y2={y(g)}
              stroke="#dcebd4"
              strokeWidth={1}
            />
            <text x={4} y={y(g) + 3} fontSize="8" fill="#5b6b56">
              {g}
            </text>
          </g>
        ))}

        <polygon points={areaPts} fill="#5aa24a" opacity={0.12} />
        <polyline
          points={linePts}
          fill="none"
          stroke="#3f7a34"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((d, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(d.pct)} r={3.5} fill="#254c1e" />
            <text
              x={x(i)}
              y={y(d.pct) - 7}
              fontSize="9"
              fontWeight="600"
              fill="#254c1e"
              textAnchor="middle"
            >
              {d.pct}%
            </text>
            <text
              x={x(i)}
              y={H - 6}
              fontSize="8"
              fill="#5b6b56"
              textAnchor="middle"
            >
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
