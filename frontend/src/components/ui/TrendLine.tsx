type TrendLineProps = {
  values: number[];
  color?: string;
  height?: number;
  area?: boolean;
};

export function TrendLine({
  values,
  color = "#4F7CFF",
  height = 42,
  area = true,
}: TrendLineProps) {
  const width = 150;
  const padding = 5;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (value - min) / range) * (height - padding * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const areaPath = `${line} L${width - padding} ${height - padding} L${padding} ${height - padding} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {area ? <path d={areaPath} fill={color} opacity="0.08" /> : null}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
