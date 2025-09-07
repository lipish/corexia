"use client";

export function MiniBar({ data, labels }: { data: number[]; labels?: string[] }) {
  const max = Math.max(1, ...data);
  const w = 240;
  const h = 80;
  const gap = 6;
  const barCount = data.length;
  const barW = (w - gap * (barCount - 1)) / barCount;
  return (
    <svg width={w} height={h} role="img" aria-label="chart" className="overflow-visible">
      {data.map((v, i) => {
        const x = i * (barW + gap);
        const barH = (v / max) * (h - 20);
        const y = h - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} className="fill-primary/70" />
          </g>
        );
      })}
    </svg>
  );
}

