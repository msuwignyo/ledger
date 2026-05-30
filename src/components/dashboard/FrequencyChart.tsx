"use client";

import * as d3 from "d3";
import { useEffect, useMemo, useRef } from "react";
import { groupTransactions } from "@/lib/transactions";
import type { Period, Transaction } from "@/lib/types";

function formatLabel(label: string): string {
  if (/^\d{4}-W\d{2}$/.test(label)) {
    return `Wk ${Number(label.slice(-2))}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    const d = new Date(`${label}T12:00:00`);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return label;
}

export function FrequencyChart({
  transactions,
  period,
}: {
  transactions: Transaction[];
  period: Period;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const data = useMemo(
    () => groupTransactions(transactions, period),
    [transactions, period],
  );

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const cs = getComputedStyle(document.documentElement);
    const accent = cs.getPropertyValue("--accent").trim() || "#8b2c1d";
    const inkFaint = cs.getPropertyValue("--ink-faint").trim() || "#8a7e6e";
    const ruleSoft = cs.getPropertyValue("--rule-soft").trim() || "#e3d9c4";

    const rotate = period === "daily" || period === "weekly";
    const margin = { top: 16, right: 16, bottom: rotate ? 64 : 40, left: 40 };
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
      .call((g) =>
        g.selectAll(".tick line").attr("stroke", ruleSoft),
      );

    // Line connecting dots
    const line = d3
      .line<(typeof data)[number]>()
      .x((d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .y((d) => y(d.count))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", accent)
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Dots
    svg
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
      .attr("cy", (d) => y(d.count))
      .attr("r", 4)
      .attr("fill", accent)
      .attr("fill-opacity", 1);

    // X axis
    const everyN =
      period === "daily" && data.length > 14 ? Math.ceil(data.length / 14) : 1;
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(
        d3
          .axisBottom(x)
          .tickSize(0)
          .tickValues(
            data.filter((_, i) => i % everyN === 0).map((d) => d.label),
          )
          .tickFormat((label) => formatLabel(String(label))),
      )
      .call((g) => g.select(".domain").remove());

    if (rotate) {
      xAxis
        .selectAll("text")
        .attr("fill", inkFaint)
        .attr("font-size", "11px")
        .attr("text-anchor", "end")
        .attr("dx", "-0.5em")
        .attr("dy", "0.3em")
        .attr("transform", "rotate(-45)");
    } else {
      xAxis
        .selectAll("text")
        .attr("fill", inkFaint)
        .attr("font-size", "11px")
        .attr("dy", "1.2em");
    }

    // Y axis
    svg
      .append("g")
      .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("d")))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove())
      .selectAll("text")
      .attr("fill", inkFaint)
      .attr("font-size", "11px");
  }, [data, period]);

  if (data.length === 0) {
    return (
      <div className="empty">Nothing recorded yet.</div>
    );
  }

  return <svg ref={svgRef} className="w-full" style={{ height: 240 }} />;
}
