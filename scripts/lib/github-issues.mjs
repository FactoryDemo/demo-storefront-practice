// Small GitHub REST helpers shared by the scripts that turn telemetry into
// issues. Uses GITHUB_TOKEN and GITHUB_REPOSITORY from the Actions runner.

const api = "https://api.github.com";

async function github(path, options = {}) {
  const response = await fetch(
    `${api}/repos/${process.env.GITHUB_REPOSITORY}${path}`,
    {
      ...options,
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "content-type": "application/json",
        ...options.headers,
      },
    }
  );
  if (!response.ok && response.status !== 422) {
    throw new Error(
      `GitHub ${options.method ?? "GET"} ${path} failed: ${response.status} ${await response.text()}`
    );
  }
  return response.status === 204 ? null : response.json();
}

/** Create the label if the repo does not have it yet. */
export async function ensureLabel(name, color, description) {
  await github("/labels", {
    method: "POST",
    body: JSON.stringify({ name, color, description }),
  });
}

/** Find the issue (open or closed) whose body carries the hidden marker. */
export async function findIssueByMarker(label, marker) {
  for (let page = 1; page <= 10; page += 1) {
    const issues = await github(
      `/issues?labels=${encodeURIComponent(label)}&state=all&per_page=100&page=${page}`
    );
    const match = issues.find((issue) =>
      issue.body?.includes(`<!-- ${marker} -->`)
    );
    if (match || issues.length < 100) {
      return match ?? null;
    }
  }
  return null;
}

/**
 * Open a new issue, or reopen a closed one when the problem was seen after
 * it was closed. Returns what happened, for the workflow log.
 */
export async function upsertIssue({
  existing,
  lastSeen,
  title,
  body,
  labels,
  reopenComment,
}) {
  if (!existing) {
    const created = await github("/issues", {
      method: "POST",
      body: JSON.stringify({ title, body, labels }),
    });
    return `opened #${created.number}`;
  }
  if (existing.state === "open") {
    return `already open as #${existing.number}`;
  }
  if (new Date(lastSeen) > new Date(existing.closed_at)) {
    await github(`/issues/${existing.number}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "open" }),
    });
    await github(`/issues/${existing.number}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: reopenComment }),
    });
    return `reopened #${existing.number}`;
  }
  return `closed as #${existing.number}, not seen since`;
}
