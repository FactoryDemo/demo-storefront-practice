# Contributing

Start with the behavior you want to change, trace its callers, and keep the patch small. `AGENTS.md` is the source of project rules; `.github/CODEOWNERS` assigns repository ownership to nicolasschmidt2001.

## Pick up work

Use the [feature map](../features/index.md) to find the right entry point. Pricing and validation belong in `lib/`, UI state belongs in `components/`, and server I/O belongs in `server/`. Read the matching test before editing.

Build features from the request and current code. Do not read, reuse, or revert earlier attempts from Git history, including reverted commits, closed or merged PRs, and `Rehearsal-*` commits (`AGENTS.md`). The [development workflow](development-workflow.md) lists the prohibited commands.

The issue templates `.github/ISSUE_TEMPLATE/bug_report.md` and `.github/ISSUE_TEMPLATE/feature_request.md` provide the repository's intake format. For bugs, reproduce the reported starting state before deciding what to change.

## Definition of done

`AGENTS.md` requires these local checks:

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
```

Add tests that cover the changed behavior, including boundaries. Run browser QA when changing pricing, cart, checkout, or UI; `.factory/skills/storefront-qa/SKILL.md` gives the manual drill. Explain checks you could not run, particularly secret-dependent Finance rules.

## Review expectations

Branch from `main` using `feature/<slug>`. The PR description must explain what changed, why, and which tests cover it; `.github/pull_request_template.md` has those sections.

Automatic deep and security review runs alongside CI for non-draft, non-Dependabot PRs (`.github/workflows/droid.yml`). PR comments mentioning `@droid` can start a separate assistant run (`.github/workflows/droid-tag.yml`).

Opening the PR ends the task. Do not wait for or poll CI unless the task specifically asks you to repair a failing check (`AGENTS.md`). See the [development workflow](development-workflow.md) and [testing guide](testing.md).
