// SPDX-License-Identifier: AGPL-3.0-or-later

import express from "express";
import { fileURLToPath } from "node:url";

import {
  optimizationPosture,
  payload,
  queryRisks,
  summary,
  verification,
  warehouseLane
} from "./services/snowflakeCostGovernanceStudioService.js";
import {
  renderDocs,
  renderOptimizationPosture,
  renderOverview,
  renderQueryRisks,
  renderVerification,
  renderWarehouseLane
} from "./services/render.js";

const app = express();
const port = Number(process.env.PORT ?? 5523);
const host = process.env.HOST || "0.0.0.0";

app.get("/", (_req, res) => res.type("html").send(renderOverview()));
app.get("/warehouse-lane", (_req, res) => res.type("html").send(renderWarehouseLane()));
app.get("/query-risks", (_req, res) => res.type("html").send(renderQueryRisks()));
app.get("/optimization-posture", (_req, res) => res.type("html").send(renderOptimizationPosture()));
app.get("/verification", (_req, res) => res.type("html").send(renderVerification()));
app.get("/docs", (_req, res) => res.type("html").send(renderDocs()));

app.get("/api/dashboard/summary", (_req, res) => res.json(summary()));
app.get("/api/warehouse-lane", (_req, res) => res.json(warehouseLane()));
app.get("/api/query-risks", (_req, res) => res.json(queryRisks()));
app.get("/api/optimization-posture", (_req, res) => res.json(optimizationPosture()));
app.get("/api/verification", (_req, res) => res.json(verification()));
app.get("/api/sample", (_req, res) => res.json(payload()));

const currentFile = fileURLToPath(import.meta.url);
const invokedDirectly = process.argv[1] !== undefined && currentFile === process.argv[1];

if (invokedDirectly) {
  app.listen(port, host, () => {
    console.log(`Snowflake Cost Governance Studio listening on http://${host}:${port}`);
  });
}

export default app;
