#!/usr/bin/env node
// Files one GitHub issue per firing Grafana alert for this repo's deployment
// (alerts carry a job label such as "demo-storefront/bean-and-byte"), and
// reopens a closed one when the alert fires again. Run by
// .github/workflows/error-issues.yml.
//
// Env: GRAFANA_URL, GRAFANA_SERVICE_ACCOUNT_TOKEN, GITHUB_TOKEN,
// GITHUB_REPOSITORY.

import {
  ensureLabel,
  findIssueByMarker,
  upsertIssue,
} from "./lib/github-issues.mjs";

const {
  GRAFANA_URL: grafanaUrl,
  GRAFANA_SERVICE_ACCOUNT_TOKEN: token,
  GITHUB_REPOSITORY: repository,
} = process.env;

const LABEL = "alert";

async function main() {
  if (!grafanaUrl || !token) {
    console.log(
      "GRAFANA_URL or GRAFANA_SERVICE_ACCOUNT_TOKEN is not set; skipping."
    );
    return;
  }
  const base = grafanaUrl.replace(/\/$/, "");
  const response = await fetch(`${base}/api/prometheus/grafana/api/v1/alerts`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(
      `Grafana alerts request failed: ${response.status} ${await response.text()}`
    );
  }
  const { data } = await response.json();
  const appRepo = repository.split("/")[1];
  const firing = (data?.alerts ?? []).filter(
    (alert) =>
      alert.state === "Alerting" &&
      alert.labels?.service === "bean-and-byte" &&
      String(alert.labels?.job ?? "").startsWith(`${appRepo}/`)
  );
  console.log(`${firing.length} firing alert(s) for ${appRepo}.`);
  await ensureLabel(
    LABEL,
    "b60205",
    "Filed automatically from a firing Grafana alert"
  );
  for (const alert of firing) {
    const name = alert.labels.alertname;
    const marker = `grafana-alert:${name}:${alert.labels.job}`;
    const existing = await findIssueByMarker(LABEL, marker);
    const result = await upsertIssue({
      existing,
      lastSeen: alert.activeAt,
      title: `[alert] ${name}`,
      body: [
        `Grafana alert **${name}** is firing for \`${alert.labels.job}\` (severity: ${alert.labels.severity ?? "unknown"}).`,
        "",
        alert.annotations?.summary ?? "",
        "",
        `- Active since: ${alert.activeAt}`,
        `- Value: ${alert.value}`,
        `- Runbook: ${alert.annotations?.runbook_url ?? "docs/runbooks/observability.md"}`,
        `- Dashboard: ${base}/d/bean-and-byte`,
        "",
        `<!-- ${marker} -->`,
      ].join("\n"),
      labels: [LABEL, `severity: ${alert.labels.severity ?? "unknown"}`],
      reopenComment: `The alert fired again at ${alert.activeAt} (value ${alert.value}).`,
    });
    console.log(`${name}: ${result}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
