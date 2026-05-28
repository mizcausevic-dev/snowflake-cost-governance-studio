import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { analyze } from "../src/analyze.js";
import { toMarkdown, toSummary } from "../src/format.js";
import type { SnowflakeCostExport } from "../src/types.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixture = (name: string): SnowflakeCostExport =>
  JSON.parse(readFileSync(`${here}/../fixtures/${name}`, "utf8")) as SnowflakeCostExport;

const NOW = "2026-05-30T00:00:00Z";

describe("analyze", () => {
  it("counts snapshots and drifts", () => {
    const report = analyze(fixture("snowflake-cost-hotspots.json"), { now: NOW });
    expect(report.snapshots).toBe(2);
    expect(report.currentSnapshots).toBe(1);
    expect(report.drifts).toBe(6);
  });

  it("flags missing current snapshot as high", () => {
    const report = analyze({ snapshots: [], drifts: [] }, { now: NOW });
    expect(report.findingsList.find((finding) => finding.code === "no-current-snapshot")?.severity).toBe("high");
  });

  it("flags stale snapshots and warehouse spikes", () => {
    const report = analyze(fixture("snowflake-cost-hotspots.json"), { now: NOW });
    expect(report.findingsList.find((finding) => finding.code === "stale-snapshot")?.subjectName).toContain("/warehouses/");
    expect(report.findingsList.find((finding) => finding.code === "warehouse-spike")).toBeDefined();
  });

  it("flags query, tagging, storage, transfer, and telemetry drift", () => {
    const report = analyze(fixture("snowflake-cost-hotspots.json"), { now: NOW, staleOptimizationAfterHours: 24 });
    expect(report.findingsList.find((finding) => finding.code === "query-cost-hotspot")?.resourceName).toBe("weekly_exec_rollup.sql");
    expect(report.findingsList.find((finding) => finding.code === "low-tag-coverage")).toBeDefined();
    expect(report.findingsList.find((finding) => finding.code === "storage-retention-bloat")).toBeDefined();
    expect(report.findingsList.find((finding) => finding.code === "telemetry-gap")).toBeDefined();
    expect(report.findingsList.find((finding) => finding.code === "stale-optimization-window")).toBeDefined();
  });

  it("flags data-transfer bursts when replication or transfer costs spike", () => {
    const report = analyze(
      {
        snapshots: [
          {
            id: "snap-transfer",
            name: "Transfer baseline",
            scope: "ACCOUNT",
            scopePath: "/accounts/kg-prod/usage/transfer",
            accountName: "KG_PROD",
            baselineStatus: "CURRENT",
            owner: "Data Platform",
            currentMonthCredits: 2000,
            budgetCredits: 2200,
            monthOverMonthChangePct: 3,
            tagCoveragePct: 98,
            idleCreditsPct: 4,
            collectedAt: NOW
          }
        ],
        drifts: [
          {
            id: "drift-transfer",
            snapshotId: "snap-transfer",
            scope: "ACCOUNT",
            scopePath: "/accounts/kg-prod/usage/replication",
            family: "Transfer",
            status: "OPEN",
            resourceName: "cross_region_replication",
            expectedState: "Replication spend stays within the expected cross-region budget.",
            observedState: "Transfer and replication costs are spiking unexpectedly.",
            estimatedImpactCredits: 360,
            changeWindowHours: 12,
            owner: "Data Platform",
            breaksGuardrail: true
          }
        ]
      },
      { now: NOW }
    );

    expect(report.findingsList.find((finding) => finding.code === "data-transfer-burst")).toBeDefined();
  });

  it("ok=true on a clean fixture", () => {
    const report = analyze(fixture("snowflake-cost-healthy.json"), { now: NOW });
    expect(report.ok).toBe(true);
    expect(report.findingsList.filter((finding) => finding.severity === "high")).toEqual([]);
  });
});

describe("formatters", () => {
  it("toMarkdown ranks high findings first", () => {
    const markdown = toMarkdown(analyze(fixture("snowflake-cost-hotspots.json"), { now: NOW }));
    expect(markdown).toContain("❌");
    expect(markdown.indexOf("🔴")).toBeLessThan(markdown.indexOf("🟠"));
  });

  it("toMarkdown handles a clean payload with no findings", () => {
    const markdown = toMarkdown(analyze(fixture("snowflake-cost-healthy.json"), { now: NOW }));
    expect(markdown).toContain("No findings.");
  });

  it("toSummary emits a one-liner", () => {
    const summary = toSummary(analyze(fixture("snowflake-cost-hotspots.json"), { now: NOW }));
    expect(summary).toMatch(/snapshots/);
    expect(summary).toMatch(/drifts/);
  });
});
