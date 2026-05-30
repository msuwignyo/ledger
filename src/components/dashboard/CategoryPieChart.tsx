"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { CategorySpending } from "@/lib/types";

const COLORS = [
  "#8b2c1d",
  "#6f5b3e",
  "#4f6b3a",
  "#a3711b",
  "#b0533f",
  "#7c6a86",
  "#5e6b5a",
  "#9a8b6f",
];

function formatShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}rb`;
  return `Rp ${amount}`;
}

export function CategoryPieChart({ data }: { data: CategorySpending[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const size = 190;
    const radius = size / 2;
    const innerRadius = radius * 0.6;

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
      .padAngle(0.02);

    const arc = d3
      .arc<d3.PieArcDatum<CategorySpending>>()
      .innerRadius(innerRadius)
      .outerRadius(radius - 2)
      .cornerRadius(1);

    const arcs = svg.selectAll(".arc").data(pie(data)).enter().append("g");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (_, i) => COLORS[i % COLORS.length])
      .attr("stroke", "#fbf7ee")
      .attr("stroke-width", 2);
  }, [data]);

  if (data.length === 0) {
    return <div className="empty">No categories yet.</div>;
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="donut-wrap">
      <div style={{ position: "relative" }}>
        <svg ref={svgRef} style={{ display: "block" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="donut-center">
            <div className="k">Total</div>
            <div className="v">{formatShort(total)}</div>
          </div>
        </div>
      </div>
      <div className="legend-list" style={{ width: "100%" }}>
        {data.slice(0, 6).map((d, i) => (
          <div className="legend-row" key={d.category}>
            <span
              className="legend-swatch"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="legend-name">{d.category}</span>
            <span className="legend-pct">
              {total > 0 ? Math.round((d.total / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
