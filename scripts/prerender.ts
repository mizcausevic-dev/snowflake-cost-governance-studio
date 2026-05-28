import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  optimizationPosture,
  payload,
  queryRisks,
  summary,
  verification,
  warehouseLane
} from "../src/services/snowflakeCostGovernanceStudioService.js";
import {
  renderDocs,
  renderOptimizationPosture,
  renderOverview,
  renderQueryRisks,
  renderVerification,
  renderWarehouseLane
} from "../src/services/render.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "site");

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(path.join(outputDir, "api", "dashboard"), { recursive: true });
fs.copyFileSync(path.join(root, "CNAME"), path.join(outputDir, "CNAME"));

const pages: Record<string, string> = {
  "index.html": renderOverview(),
  [path.join("warehouse-lane", "index.html")]: renderWarehouseLane(),
  [path.join("query-risks", "index.html")]: renderQueryRisks(),
  [path.join("optimization-posture", "index.html")]: renderOptimizationPosture(),
  [path.join("verification", "index.html")]: renderVerification(),
  [path.join("docs", "index.html")]: renderDocs()
};

for (const [relativePath, html] of Object.entries(pages)) {
  const fullPath = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, html, "utf8");
}

const apiPayloads: Record<string, unknown> = {
  [path.join("api", "dashboard", "summary.json")]: summary(),
  [path.join("api", "warehouse-lane.json")]: warehouseLane(),
  [path.join("api", "query-risks.json")]: queryRisks(),
  [path.join("api", "optimization-posture.json")]: optimizationPosture(),
  [path.join("api", "verification.json")]: verification(),
  [path.join("api", "sample.json")]: payload()
};

for (const [relativePath, data] of Object.entries(apiPayloads)) {
  const fullPath = path.join(outputDir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), "utf8");
}
