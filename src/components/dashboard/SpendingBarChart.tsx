"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { GroupedSpending } from "@/lib/types";

export function SpendingBarChart({ data }: { data: GroupedSpending[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const margin = { top: 16, right: 16, bottom: 40, left: 64 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, width])
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.total) ?? 0])
      .nice()
      .range([height, 0]);

    // Gridlines
    svg
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(-width)
          .tickFormat(() => ""),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#e4e4e7"));

    // Bars
    svg
      .selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label) ?? 0)
      .attr("y", (d) => y(d.total))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.total))
      .attr("fill", "#6366f1")
      .attr("rx", 3);

    // X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#71717a")
      .attr("font-size", "11px")
      .attr("dy", "1.2em");

    // Y axis
    svg
      .append("g")
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickFormat((v) => {
            const n = Number(v);
            if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}jt`;
            if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
            return String(n);
          }),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .selectAll("text")
      .attr("fill", "#71717a")
      .attr("font-size", "11px");
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-zinc-400">
        No data yet — upload a statement to get started.
      </div>
    );
  }

  return <svg ref={svgRef} className="w-full" style={{ height: 240 }} />;
}
