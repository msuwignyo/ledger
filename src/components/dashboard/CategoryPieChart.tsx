"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { CategorySpending } from "@/lib/types";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#60a5fa",
];

export function CategoryPieChart({ data }: { data: CategorySpending[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const size = 200;
    const radius = size / 2;
    const innerRadius = radius * 0.55;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("width", size)
      .attr("height", size)
      .append("g")
      .attr("transform", `translate(${radius},${radius})`);

    const pie = d3
      .pie<CategorySpending>()
      .value((d) => d.total)
      .sort(null);
    const arc = d3
      .arc<d3.PieArcDatum<CategorySpending>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 4);

    const arcs = svg.selectAll(".arc").data(pie(data)).enter().append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (_, i) => COLORS[i % COLORS.length])
      .attr("stroke", "white")
      .attr("stroke-width", 2);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-zinc-400">
        No data
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg ref={svgRef} />
      <div className="w-full flex flex-col gap-1">
        {data.slice(0, 5).map((d, i) => (
          <div key={d.category} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-zinc-600 truncate flex-1">{d.category}</span>
            <span className="text-zinc-500">
              {total > 0 ? Math.round((d.total / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
