#!/usr/bin/env node
// Verifies that AGENTS.md only references npm scripts that exist in
// package.json and relative file paths that exist in the repository.
import { existsSync, readFileSync } from "node:fs";

const AGENTS_FILE = "AGENTS.md";
const NPM_BUILTINS = new Set(["ci", "install", "i", "exec", "ls", "audit"]);
const NPM_SCRIPT_SHORTCUTS = new Set(["test", "start", "stop", "restart"]);
const NPM_COMMAND = /\bnpm\s+(run\s+)?([\w:.-]+)/g;
const PATH_LIKE = /^\.?[\w@.-]+(?:\/[\w@.-]+)*\/?$/;
const FILE_EXTENSION = /\.(?:[cm]?[jt]sx?|json|md|ya?ml|css)$/;

/** Inline code spans and fenced code blocks, in document order. */
function codeSnippets(markdown) {
  const snippets = [];
  const withoutFences = markdown.replace(
    /```[^\n]*\n([\s\S]*?)```/g,
    (_, body) => {
      snippets.push(...body.split("\n"));
      return "";
    }
  );
  for (const match of withoutFences.matchAll(/`([^`\n]+)`/g)) {
    snippets.push(match[1]);
  }
  return snippets;
}

// Scoped names such as `@scope/package` are packages or lint rules, not paths.
function isRelativePath(snippet) {
  return (
    PATH_LIKE.test(snippet) &&
    !snippet.startsWith("@") &&
    (snippet.includes("/") || FILE_EXTENSION.test(snippet))
  );
}

function checkNpmCommands(snippet, scripts, problems) {
  let count = 0;
  for (const [, run, name] of snippet.matchAll(NPM_COMMAND)) {
    count += 1;
    if (run || NPM_SCRIPT_SHORTCUTS.has(name)) {
      if (!(name in scripts)) {
        problems.push(
          `\`npm ${run ?? ""}${name}\`: no "${name}" script in package.json`
        );
      }
    } else if (!NPM_BUILTINS.has(name)) {
      problems.push(
        `\`npm ${name}\`: not a known npm command or script shortcut`
      );
    }
  }
  return count;
}

const markdown = readFileSync(AGENTS_FILE, "utf8");
const scripts = JSON.parse(readFileSync("package.json", "utf8")).scripts ?? {};
const problems = [];
let commandCount = 0;
let pathCount = 0;

for (const snippet of codeSnippets(markdown)) {
  commandCount += checkNpmCommands(snippet, scripts, problems);
  if (isRelativePath(snippet)) {
    pathCount += 1;
    if (!existsSync(snippet)) {
      problems.push(`\`${snippet}\`: path does not exist`);
    }
  }
}

if (problems.length > 0) {
  console.error(`${AGENTS_FILE} is out of date:`);
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  process.exit(1);
}
console.log(
  `${AGENTS_FILE} OK: ${commandCount} npm command(s) and ${pathCount} path(s) checked.`
);
