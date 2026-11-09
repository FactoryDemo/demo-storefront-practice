#!/usr/bin/env node
// Files one GitHub issue per PostHog error tracking issue seen in this repo's
// deployed app (production or preview), and reopens a closed one when the
// error comes back. Run by .github/workflows/error-issues.yml.
//
// Env: POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID, POSTHOG_HOST (optional),
// GITHUB_TOKEN, GITHUB_REPOSITORY, LOOKBACK_HOURS (optional, default 24).

import {
  ensureLabel,
  findIssueByMarker,
  upsertIssue,
} from "./lib/github-issues.mjs";

const {
  POSTHOG_PERSONAL_API_KEY: apiKey,
  POSTHOG_PROJECT_ID: projectId,
  POSTHOG_HOST: host = "https://us.posthog.com",
  GITHUB_REPOSITORY: repository,
  LOOKBACK_HOURS: lookbackHours = "24",
} = process.env;

const LABEL = "error-tracking";

async function main() {
  if (!apiKey || !projectId) {
    console.log(
      "POSTHOG_PERSONAL_API_KEY or POSTHOG_PROJECT_ID is not set; skipping."
    );
    return;
  }
  const appRepo = repository.split("/")[1].replace(/[^\w.-]/g, "");
  const hours = Math.max(
    1,
    Math.min(168, Number.parseInt(lookbackHours, 10) || 24)
  );
  const errors = await recentErrors(appRepo, hours);
  console.log(
    `${errors.length} PostHog error issue(s) in the last ${hours}h for ${appRepo}.`
  );
  await ensureLabel(
    LABEL,
    "d73a4a",
    "Filed automatically from PostHog error tracking"
  );
  for (const error of errors) {
    const marker = `posthog-issue:${error.issueId}`;
    const existing = await findIssueByMarker(LABEL, marker);
    const result = await upsertIssue({
      existing,
      lastSeen: error.lastSeen,
      title: `[error] ${error.type}: ${truncate(error.message, 90)}`,
      body: issueBody(error, hours, marker),
      labels: ["bug", LABEL],
      reopenComment: `PostHog saw this error again: ${error.occurrences} time(s) in the last ${hours}h, most recently ${error.lastSeen} on \`${error.version}\`.`,
    });
    console.log(`${error.issueId}: ${result}`);
  }
}

async function recentErrors(appRepo, hours) {
  const query = `
    select
      properties.$exception_issue_id as issue_id,
      argMax(properties.$exception_types, timestamp),
      argMax(properties.$exception_values, timestamp),
      argMax(properties.$exception_list, timestamp),
      count(),
      count(distinct properties.$session_id),
      min(timestamp),
      max(timestamp),
      argMax(properties.$current_url, timestamp),
      argMax(properties.route, timestamp),
      argMax(properties.appVersion, timestamp),
      argMax(properties.appEnvironment, timestamp),
      argMax(properties.$lib, timestamp)
    from events
    where event = '$exception'
      and properties.appRepo = '${appRepo}'
      and properties.appEnvironment in ('production', 'preview')
      and timestamp > now() - interval ${hours} hour
      and issue_id is not null
    group by issue_id
    order by count() desc
    limit 20`;
  const response = await fetch(`${host}/api/environments/${projectId}/query/`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  });
  if (!response.ok) {
    throw new Error(
      `PostHog query failed: ${response.status} ${await response.text()}`
    );
  }
  const { results } = await response.json();
  return results.map((row) => ({
    issueId: row[0],
    type: firstOf(row[1]) ?? "Error",
    message: firstOf(row[2]) ?? "(no message)",
    frames: topFrames(row[3]),
    occurrences: row[4],
    sessions: row[5],
    firstSeen: row[6],
    lastSeen: row[7],
    url: row[8],
    route: row[9],
    version: row[10] ?? "unknown",
    environment: row[11],
    source: row[12] === "posthog-node" ? "server" : "browser",
  }));
}

function issueBody(error, hours, marker) {
  const link = `${host}/project/${projectId}/error_tracking/${error.issueId}`;
  const where =
    error.source === "server"
      ? `server, route \`${error.route ?? "unknown"}\``
      : `browser, ${error.url ?? "unknown page"}`;
  const lines = [
    `PostHog error tracking saw this error in the deployed storefront. [Open it in PostHog](${link}) for every occurrence, the browser session, and the full stack.`,
    "",
    "| | |",
    "| --- | --- |",
    `| Error | \`${error.type}: ${truncate(error.message, 200).replace(/\|/g, "\\|")}\` |`,
    `| Seen | ${error.occurrences} time(s) in ${error.sessions} session(s), last ${hours}h |`,
    `| First / last seen | ${error.firstSeen} / ${error.lastSeen} |`,
    `| Where | ${where} |`,
    `| Version | \`${error.version}\` (${error.environment}) |`,
  ];
  if (error.frames.length > 0) {
    lines.push("", "Top of the stack:", "", "```", ...error.frames, "```");
  }
  lines.push(
    "",
    "Start with the version above: compare it with the previous deploy in the Deploy workflow and the Bean & Byte dashboard in Grafana (deploys are annotated).",
    "",
    `<!-- ${marker} -->`
  );
  return lines.join("\n");
}

function firstOf(jsonList) {
  try {
    const list = typeof jsonList === "string" ? JSON.parse(jsonList) : jsonList;
    return Array.isArray(list) ? list[0] : undefined;
  } catch {
    return undefined;
  }
}

function topFrames(exceptionList) {
  try {
    const list =
      typeof exceptionList === "string"
        ? JSON.parse(exceptionList)
        : exceptionList;
    const frames = list?.[0]?.stacktrace?.frames ?? [];
    return frames
      .slice(-6)
      .reverse()
      .map(
        (frame) =>
          `at ${frame.function ?? "<anonymous>"} (${frame.filename ?? frame.abs_path ?? "?"}:${frame.lineno ?? "?"}:${frame.colno ?? "?"})`
      );
  } catch {
    return [];
  }
}

function truncate(text, length) {
  const value = String(text).replace(/\s+/g, " ").trim();
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
