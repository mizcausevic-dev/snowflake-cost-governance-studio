import { describe, expect, test } from "vitest";

import {
  renderDocs,
  renderOptimizationPosture,
  renderOverview,
  renderQueryRisks,
  renderVerification,
  renderWarehouseLane
} from "./render.js";

describe("render", () => {
  test("overview carries the Snowflake cost framing", () => {
    expect(renderOverview()).toContain("Snowflake cost posture");
    expect(renderOverview()).toContain("warehouse-cost proof");
  });

  test("lane and posture routes render expected headings", () => {
    expect(renderWarehouseLane()).toContain("Warehouse Lane");
    expect(renderQueryRisks()).toContain("Query Risks");
    expect(renderOptimizationPosture()).toContain("Optimization Posture");
  });

  test("docs and verification remain operator-safe", () => {
    expect(renderDocs()).toContain("Offline Snowflake cost analysis");
    expect(renderVerification()).toContain("synthetic data");
  });
});
