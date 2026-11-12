# Dependency maintenance

Data collected on 2026-11-12. A read-only `npm audit --json` after `npm ci` reported 20 vulnerable package entries: 11 moderate, five high, and four critical. These are existing dependency findings, not failures introduced by documentation (`package.json`, `package-lock.json`).

## Audit snapshot

| Severity | Package entries | Scope |
| --- | --- | --- |
| Critical | `next`, `vitest`, `@vitest/coverage-v8`, `tinypool` | Application framework and development/test tooling |
| High | `@next/eslint-plugin-next`, `eslint-config-next`, `glob`, `postcss`, `vite` | Framework tooling and transitive build/test dependencies |
| Moderate | 11 further entries | TypeScript lint tooling, coverage, matching, and Vite-related packages |

The count includes transitive and inherited advisories. It is not the number of distinct vulnerabilities, and it does not establish that every advisory is exploitable through this storefront. Audit returned exit 1 because it found advisories; the existing unit tests, typecheck, and lint passed separately.

Examples worth triaging include [Next.js image optimization SVG handling](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [Vitest UI server file access/execution](https://github.com/advisories/GHSA-5xrq-8626-4rwp), and [Tinypool worker options](https://github.com/advisories/GHSA-85c8-ppgw-ccpr). Check affected versions and preconditions against the actual deployment and commands. `package.json` uses non-interactive `vitest run`, not a public Vitest UI server.

## A bounded follow-up

1. Re-run `npm audit --json` when taking up remediation; registry results change over time.
2. Separate production runtime exposure from developer/CI-only paths.
3. Check upstream fixes and compatibility before choosing a minimal supported update.
4. Update `package.json` and `package-lock.json` together, then exercise required checks, production build, and browser flow.

Do not blindly run `npm audit fix --force`. The audit suggested major-version changes, including a framework migration, and `.github/dependabot.yml` deliberately excludes major updates and several known runtime/peer incompatibilities. Those constraints require review rather than automatic removal.

## Other cleanup signals

The existing `scripts/todo-report.mjs` reported zero TODO/FIXME/HACK comments during generation. This says nothing about unmarked defects or unused code; no dead-code finding is asserted here.

See [dependencies](reference/dependencies.md), [security boundaries](security.md), and [tooling](how-to-contribute/tooling.md).
