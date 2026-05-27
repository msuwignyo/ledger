"use client";

import * as d3 from "d3";
import { useEffect, useRef } from "react";
import type { Transaction } from "@/lib/types";

type DayCount = { date: string; count: number };

function countByDay(transactions: Transaction[]): DayCount[] {
  const map = new Map<string, number>();
  for (const tx of transactions) {
    map.set(tx.date, (map.get(tx.date) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export function FrequencyChart({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const data = countByDay(transactions);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const margin = { top: 16, right: 16, bottom: 40, left: 40 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => new Date(d.date)) as [Date, Date])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.count) ?? 1])
      .nice()
      .range([height, 0]);

    // Gridlines
    svg
      .append("g")
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(-width)
          .tickFormat(() => ""),
      )
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#e4e4e7"));

    // Dots
    svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(new Date(d.date)))
      .attr("cy", (d) => y(d.count))
      .attr("r", 4)
      .attr("fill", "#6366f1")
      .attr("fill-opacity", 0.7);

    // X axis
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .selectAll("text")
      .attr("fill", "#71717a")
      .attr("font-size", "11px")
      .attr("dy", "1.2em");

    // Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y).ticks(4))
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
