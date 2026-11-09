#!/usr/bin/env node
// Applies observability/grafana/ to Grafana: the "Bean & Byte" folder, the
// storefront dashboard, and the alert rule group. Safe to rerun; everything
// is keyed by uid. Run by .github/workflows/observability.yml, or locally
// with GRAFANA_URL and GRAFANA_SERVICE_ACCOUNT_TOKEN set.

import { readFile } from "node:fs/promises";

const { GRAFANA_URL: grafanaUrl, GRAFANA_SERVICE_ACCOUNT_TOKEN: token } =
  process.env;

async function grafana(path, options = {}) {
  const response = await fetch(`${grafanaUrl.replace(/\/$/, "")}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      // Keep provisioned rules editable in the Grafana UI.
      "x-disable-provenance": "true",
      ...options.headers,
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${path} failed: ${response.status} ${text}`
    );
  }
  return text ? JSON.parse(text) : null;
}

async function readJson(name) {
  return JSON.parse(
    await readFile(
      new URL(`../observability/grafana/${name}`, import.meta.url),
      "utf8"
    )
  );
}

async function ensureFolder({ uid, title }) {
  const folders = await grafana("/api/folders");
  if (!folders.some((folder) => folder.uid === uid)) {
    await grafana("/api/folders", {
      method: "POST",
      body: JSON.stringify({ uid, title }),
    });
    console.log(`Created folder ${title}`);
  }
}

async function prometheusUid() {
  const datasources = await grafana("/api/datasources");
  const prom = datasources.find(
    (ds) => ds.type === "prometheus" && /-prom$/.test(ds.name)
  );
  if (!prom) {
    throw new Error(
      "No Grafana Cloud Prometheus data source (name ending in -prom) found"
    );
  }
  return prom.uid;
}

async function main() {
  if (!grafanaUrl || !token) {
    console.log(
      "GRAFANA_URL or GRAFANA_SERVICE_ACCOUNT_TOKEN is not set; skipping."
    );
    return;
  }
  const { folder, group, rules } = await readJson("alert-rules.json");
  const dashboard = await readJson("dashboard.json");
  await ensureFolder(folder);

  const saved = await grafana("/api/dashboards/db", {
    method: "POST",
    body: JSON.stringify({
      dashboard,
      folderUid: folder.uid,
      overwrite: true,
      message: "Synced from observability/grafana",
    }),
  });
  console.log(`Dashboard: ${saved.url}`);

  const promUid = await prometheusUid();
  const resolved = rules.map((rule) => ({
    ...rule,
    folderUID: folder.uid,
    ruleGroup: group.title,
    data: rule.data.map((query) => ({
      ...query,
      datasourceUid:
        query.datasourceUid === "__PROMETHEUS__"
          ? promUid
          : query.datasourceUid,
    })),
  }));
  await grafana(
    `/api/v1/provisioning/folder/${folder.uid}/rule-groups/${encodeURIComponent(group.title)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        title: group.title,
        folderUid: folder.uid,
        interval: group.interval,
        rules: resolved,
      }),
    }
  );
  console.log(`Alert rules: ${resolved.map((rule) => rule.title).join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
