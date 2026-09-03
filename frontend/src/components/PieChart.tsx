export type PieSlice = {
  label: string;
  value: number;
  color: string;
};

const PALETTE = ["#0072bb", "#fdc854", "#0e8c45", "#2baab1", "#00548c", "#e8aa1c", "#7a3e9d", "#c45c26"];

export function countSlices(values: string[], colors = PALETTE): PieSlice[] {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const label = raw.trim() || "Not stated";
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, value], index) => ({
      label,
      value,
      color: colors[index % colors.length],
    }));
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const from = polar(cx, cy, r, start);
  const to = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${from.x} ${from.y} A ${r} ${r} 0 ${large} 1 ${to.x} ${to.y} Z`;
}

export function PieChart({ title, slices }: { title: string; slices: PieSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  let angle = 0;
  const paths = slices.map((slice) => {
    const sweep = total ? (slice.value / total) * 360 : 0;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    return { ...slice, start, end, sweep };
  });

  return (
    <article className="pie-card">
      <h3 className="pie-title">{title}</h3>
      {total === 0 ? (
        <p className="pie-empty">No registrations yet.</p>
      ) : (
        <>
          <svg className="pie-svg" viewBox="0 0 160 160" role="img" aria-label={`${title} breakdown`}>
            {paths.length === 1 ? (
              <circle cx="80" cy="80" r="74" fill={paths[0].color} />
            ) : (
              paths.map((slice) => (
                <path key={slice.label} d={slicePath(80, 80, 74, slice.start, slice.end)} fill={slice.color} />
              ))
            )}
            <circle cx="80" cy="80" r="38" fill="#fff" />
            <text x="80" y="76" textAnchor="middle" className="pie-total">
              {total}
            </text>
            <text x="80" y="94" textAnchor="middle" className="pie-total-label">
              students
            </text>
          </svg>
          <ul className="pie-legend">
            {paths.map((slice) => (
              <li key={slice.label}>
                <span className="pie-swatch" style={{ background: slice.color }} />
                <span className="pie-legend-copy">
                  <strong>{slice.label}</strong>
                  <em>
                    {slice.value} · {Math.round((slice.value / total) * 100)}%
                  </em>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
