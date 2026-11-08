#!/usr/bin/env node
// Lists TODO, FIXME, and HACK comments in source files. Report-only: always
// exits 0 so it can run in CI without blocking.
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const SOURCE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
]);
const SKIPPED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "node_modules",
  "out",
  "coverage",
  "reports",
  "playwright-report",
  "test-results",
  "docs",
]);
const MARKER =
  /(?:\/\/|\/\*|^\s*\*)\s*(TODO|FIXME|HACK)\b[\s:(-]*(.*?)\s*(?:\*\/)?$/;

function* sourceFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        yield* sourceFiles(join(directory, entry.name));
      }
    } else if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
      yield join(directory, entry.name);
    }
  }
}

const findings = [];
for (const file of sourceFiles(ROOT)) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    const match = MARKER.exec(line);
    if (match) {
      findings.push({
        location: `${relative(ROOT, file)}:${index + 1}`,
        tag: match[1],
        text: match[2],
      });
    }
  });
}

const counts = { TODO: 0, FIXME: 0, HACK: 0 };
for (const finding of findings) {
  counts[finding.tag] += 1;
  console.log(`${finding.location}  ${finding.tag}  ${finding.text}`);
}
console.log(
  `\n${findings.length} tech debt marker(s): ` +
    `${counts.TODO} TODO, ${counts.FIXME} FIXME, ${counts.HACK} HACK`
);
