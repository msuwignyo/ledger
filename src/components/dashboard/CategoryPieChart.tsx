"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { CategorySpending } from "@/lib/types";

const COLORS = [
  "#4E82F7",
  "#F5A623",
  "#34D399",
  "#F472B6",
  "#A78BFA",
  "#38BDF8",
  "#FB923C",
  "#4ADE80",
];

export function CategoryPieChart({ data }: { data: CategorySpending[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const size = 200;
    const radius = size / 2;
    const innerRadius = radius * 0.58;

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
      .sort(null)
      .padAngle(0.025);

    const arc = d3
      .arc<d3.PieArcDatum<CategorySpending>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 2)
      .cornerRadius(2);

    const arcs = svg.selectAll(".arc").data(pie(data)).enter().append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (_, i) => COLORS[i % COLORS.length])
      .attr("stroke", "#111722")
      .attr("stroke-width", 1.5);
  }, [data]);

  if (data.length === 0) {
    return (
      <div
        className="flex h-40 items-center justify-center text-sm"
        style={{ color: "#3D4465" }}
      >
        No data
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="flex flex-col items-center gap-5">
      <svg ref={svgRef} />
      <div className="w-full flex flex-col gap-2">
        {data.slice(0, 5).map((d, i) => (
          <div key={d.category} className="flex items-center gap-2.5 text-xs">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="truncate flex-1" style={{ color: "#7A80A0" }}>
              {d.category}
            </span>
            <span
              className="font-mono font-medium"
              style={{ color: "#9AA0BE" }}
            >
              {total > 0 ? Math.round((d.total / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
