#!/usr/bin/env node
// Prints a Markdown summary of coverage (coverage/coverage-summary.json) and
// test durations (reports/junit.xml) for $GITHUB_STEP_SUMMARY.
import { existsSync, readFileSync } from "node:fs";

const COVERAGE_FILE = "coverage/coverage-summary.json";
const JUNIT_FILE = "reports/junit.xml";
const SLOWEST_COUNT = 10;
const XML_ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function attributes(tag) {
  const result = {};
  for (const [, key, value] of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    result[key] = value.replace(
      /&(\w+);/g,
      (m, name) => XML_ENTITIES[name] ?? m
    );
  }
  return result;
}

function tableCell(value) {
  return String(value).replace(/\|/g, "\\|");
}

function coverageSection() {
  const lines = ["## Coverage", ""];
  if (!existsSync(COVERAGE_FILE)) {
    return [...lines, `No ${COVERAGE_FILE} found.`, ""];
  }
  const { total } = JSON.parse(readFileSync(COVERAGE_FILE, "utf8"));
  lines.push("| Metric | Covered | Total | % |", "| --- | --- | --- | --- |");
  for (const metric of ["statements", "branches", "functions", "lines"]) {
    const { covered, total: count, pct } = total[metric];
    lines.push(`| ${metric} | ${covered} | ${count} | ${pct}% |`);
  }
  return [...lines, ""];
}

function durationSection() {
  const lines = ["## Test durations", ""];
  if (!existsSync(JUNIT_FILE)) {
    return [...lines, `No ${JUNIT_FILE} found.`, ""];
  }
  const xml = readFileSync(JUNIT_FILE, "utf8");
  const suites = attributes(/<testsuites\b[^>]*>/.exec(xml)?.[0] ?? "");
  const cases = [...xml.matchAll(/<testcase\b[^>]*>/g)].map((match) => {
    const { classname = "", name = "", time = "0" } = attributes(match[0]);
    return { file: classname, name, seconds: Number(time) };
  });
  lines.push(
    `${suites.tests ?? cases.length} tests, ${suites.failures ?? 0} failures, ` +
      `${Number(suites.time ?? 0).toFixed(2)}s total.`,
    "",
    "| Slowest tests | File | Seconds |",
    "| --- | --- | --- |"
  );
  const slowest = cases
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, SLOWEST_COUNT);
  for (const testCase of slowest) {
    lines.push(
      `| ${tableCell(testCase.name)} | ${tableCell(testCase.file)} | ${testCase.seconds.toFixed(3)} |`
    );
  }
  return [...lines, ""];
}

console.log([...coverageSection(), ...durationSection()].join("\n"));
