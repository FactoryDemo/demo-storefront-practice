# By the numbers

Data collected on **2026-11-12**, commit [`e0462e9`](https://github.com/FactoryDemo/demo-storefront-practice/commit/e0462e94b0cfa8c89bd419994343526e3800fc53). These are repository measurements, not production usage or individual contributor statistics. See [architecture](overview/architecture.md) for what the code does and [lore](lore.md) for how it grew.

## Scope and counting rules

The snapshot uses `git ls-tree -r --name-only HEAD` and each file's committed contents (`git show HEAD:<path>`), not the installed working tree or this refresh's uncommitted edits. The now-tracked `droid-wiki/` is counted separately, outside application, test, configuration, and non-wiki documentation metrics. A **physical line** is one Python `str.splitlines()` entry, including blank lines and comments; a final newline does not add an extra line, and a nonempty final line counts without a terminating newline. This is not executable LOC, statement count, or a comment-stripped estimate.

| Category | Definition | Files | Physical lines |
| --- | --- | ---: | ---: |
| Source | All tracked files under `app/`, `components/`, `lib/`, `server/`, `scripts/`, plus `instrumentation.ts`; includes CSS and operational JavaScript | 42 | 3,499 |
| Tests | `tests/` and `e2e/`: eight Vitest modules and one Playwright module | 9 | 1,060 |
| Configuration and automation | Remaining non-Markdown text outside `droid-wiki/`: root configs/manifests, `.github/` YAML and ownership rules, `.devcontainer/`, `.husky/`, `.env.example`, and `observability/grafana/` JSON | 35 | 1,704 |
| **Source + tests + configuration** | Disjoint categories above | **86** | **6,263** |
| Documentation | Tracked Markdown outside `droid-wiki/`, including `AGENTS.md`, `README.md`, `docs/`, GitHub templates, and `.factory/skills/storefront-qa/SKILL.md` | 9 | 594 |
| Generated wiki | Tracked `droid-wiki/`: 31 Markdown pages (1,739 lines) and `droid-wiki/.wiki-meta.json` (64 lines) | 32 | 1,803 |
| Assets | JPEG files under `public/products/`; no binary line count | 13 | Not counted |
| Excluded generated/lock files | `package-lock.json` and `next-env.d.ts` | 2 | Excluded |

There are **142 tracked files** in total: 86 source/test/configuration + 9 non-wiki documentation + 32 wiki + 13 assets + 2 excluded files. There is **one package**, defined by the single tracked `package.json`; this is not a monorepo. No `node_modules/`, generated `droid-wiki/`, build artifacts, lockfile lines, or JPEG bytes enter source metrics. Test/source ratios are **9:42 files** and **30.3% physical lines**; neither measures coverage.

Since the prior snapshot at [`11789b4`](https://github.com/FactoryDemo/demo-storefront-practice/commit/11789b48e07aaee25433cc2f67bb15e101c401a5), the committed delta is **35 files, 618 additions and 99 deletions**: a wiki refresh plus the active SAVE10 promotion change. The latter adds `components/PromoCodeField.tsx` and `tests/promotions.test.ts`. All counts below, including source language totals, directory means, import graphs, and exports, were freshly recomputed from committed blobs. No installed files or concurrent documentation edits enter these counts.

## Source languages

```mermaid
xychart-beta horizontal
  title "Committed source physical lines: 2026-11-12"
  x-axis ["TypeScript + TSX", "CSS", "JavaScript"]
  y-axis "Physical lines" 0 --> 2200
  bar [2044, 769, 686]
```

| Language | Files | Physical lines | Share of source lines |
| --- | ---: | ---: | ---: |
| TypeScript, including TSX | 34 | 2,044 | 58.4% |
| CSS | 1 | 769 | 22.0% |
| JavaScript (`.mjs`) | 7 | 686 | 19.6% |
| **Total** | **42** | **3,499** | **100%** |

TypeScript splits into 17 `.ts` files / 1,128 lines and 17 `.tsx` files / 916 lines. Tests and executable root configuration files are deliberately outside this source-only chart.

### Average size by source directory

Arithmetic mean = physical lines divided by files, including CSS where present. Paths are repository-root relative.

| Source location | Files | Physical lines | Mean lines/file |
| --- | ---: | ---: | ---: |
| `app/` | 9 | 967 | 107.4 |
| `components/` | 13 | 895 | 68.8 |
| `lib/` | 8 | 593 | 74.1 |
| `scripts/` | 7 | 686 | 98.0 |
| `server/` | 4 | 341 | 85.3 |
| Root: `instrumentation.ts` | 1 | 17 | 17.0 |
| **All source** | **42** | **3,499** | **83.3** |

`app/globals.css` alone contributes 769 lines, so `app/`'s mean should not be read as the typical route-module size.

## Activity and attribution

The complete history reachable from `HEAD` contains **38 commits**, from **2026-11-01 through 2026-11-12**: **33 non-merge commits and five merges**. Counts below include merges and use recorded committer calendar dates (`git log --format=%cs`), with Monday-based weeks. The newest week and November are incomplete.

| Recent week | Commits |
| --- | ---: |
| 2026-10-19–2026-10-25 | 0 |
| 2026-10-26–2026-11-01 | 1 |
| 2026-11-02–2026-11-08 | 20 |
| 2026-11-09–2026-11-12, through snapshot | 17 |

| Recent month | Commits |
| --- | ---: |
| 2026-08 | 0 |
| 2026-09 | 0 |
| 2026-10 | 0 |
| 2026-11, through November 12 | 38 |

Zero earlier counts mean the repository did not yet have commits, not an observed slowdown in an established project.

**21 of 38 commits (approximately 55.3%) are explicitly bot-attributed.** A commit qualifies when its author name/email contains `[bot]` or a `Co-authored-by:` trailer contains `[bot]`; each commit is counted once. Here that is two bot-authored dependency commits and 19 bot-coauthored commits, with no overlap. The [initial wiki-only commit](https://github.com/FactoryDemo/demo-storefront-practice/commit/3c5575cfdba7a787f77a313b622e4cff70d9596f) has neither marker; the [SAVE10 rehearsal commit](https://github.com/FactoryDemo/demo-storefront-practice/commit/b83863dbfa7836f5215e9672534cc57a9b828baa) has bot coauthor markers and counts once despite repeated trailers. The [reversion](https://github.com/FactoryDemo/demo-storefront-practice/commit/3461fc30f6b24b1cc8a7497bdfcd9e34c9bc90df) and [wiki automation update](https://github.com/FactoryDemo/demo-storefront-practice/commit/11789b48e07aaee25433cc2f67bb15e101c401a5) also have bot coauthor trailers. The active [SAVE10 reintroduction](https://github.com/FactoryDemo/demo-storefront-practice/commit/e0462e94b0cfa8c89bd419994343526e3800fc53) is bot-coauthored; the [latest committed wiki refresh](https://github.com/FactoryDemo/demo-storefront-practice/commit/c153cf561070227aa3207b16bf534fd4cdade1bd) has neither marker. Subjects alone are not evidence of attribution. Merge messages are not inferred to inherit attribution from their parents. This is a **lower bound on AI-assisted work**, not a measurement of AI-written lines: bot attribution also includes dependency automation, and uncredited assistance cannot be detected from Git. No individual rankings are inferred.

### Highest-churn paths in the last 90 days

Window: **2026-08-15 00:00 UTC inclusive to 2026-11-13 00:00 UTC exclusive**. Sum additions and deletions from `git diff-tree --root --numstat -r` for every reachable non-merge commit in that window. Initial additions count; merge diffs do not count twice. Exclude binaries, lockfiles, generated declarations/wiki, and installed dependencies. Non-wiki documentation and configuration remain eligible. All 33 non-merge commits fall inside this window.

| Path | Added | Deleted | Churn (added + deleted) | Touching non-merge commits |
| --- | ---: | ---: | ---: | ---: |
| `app/globals.css` | 834 | 65 | 899 | 4 |
| `observability/grafana/dashboard.json` | 522 | 0 | 522 | 1 |
| `e2e/storefront.spec.ts` | 346 | 125 | 471 | 5 |
| `components/Checkout.tsx` | 245 | 44 | 289 | 5 |
| `tests/orders.test.ts` | 242 | 37 | 279 | 4 |
| `tests/pricing.test.ts` | 193 | 65 | 258 | 6 |
| `components/Storefront.tsx` | 159 | 89 | 248 | 3 |
| `docs/architecture.md` | 190 | 49 | 239 | 6 |
| `.github/workflows/droid.yml` | 133 | 93 | 226 | 7 |
| `lib/orders.ts` | 185 | 21 | 206 | 4 |

The highest-churn directories use the same window and exclusions. A commit touching several files in one directory counts once in that directory's last column.

| Directory | Added | Deleted | Churn | Touching non-merge commits |
| --- | ---: | ---: | ---: | ---: |
| `components/` | 1,099 | 204 | 1,303 | 6 |
| `.github/` | 947 | 179 | 1,126 | 20 |
| `app/` | 1,040 | 73 | 1,113 | 5 |
| `tests/` | 968 | 129 | 1,097 | 8 |
| `lib/` | 663 | 70 | 733 | 9 |

This young repository's churn is mostly construction, not a defect-rate or maintenance-cost proxy. The large dashboard is configuration, not application source.

## Static relative import depth

The TypeScript parser inspected the committed contents of all **41 source TS/TSX/MJS modules** at this snapshot. Only top-level static ES `import` and `export … from` declarations with relative specifiers are edges; resolve to tracked source files using the literal path, supported module extensions, or an index module. CSS is a terminal source node. There are **87 resolved static relative edges**, including **14 type-only edges**, and no unresolved relative imports or cycles in this measured graph.

The deepest path has **ten edges / eleven files**, including type-only dependencies:

```text
app/checkout/page.tsx
→ components/Checkout.tsx
→ components/PromoCodeField.tsx
→ components/CartProvider.tsx
→ components/posthog.ts
→ lib/analytics.ts
→ lib/orders.ts
→ lib/pricing.ts
→ lib/promotions.ts
→ lib/products.ts
→ lib/types.ts
```

Excluding fully type-only import declarations leaves **73 edges** and a maximum of **eight edges / nine files**:

```text
app/checkout/page.tsx
→ components/Checkout.tsx
→ components/PromoCodeField.tsx
→ components/CartProvider.tsx
→ components/posthog.ts
→ lib/analytics.ts
→ lib/pricing.ts
→ lib/promotions.ts
→ lib/products.ts
```

Depth is the longest simple path, not the number of imports in one module. Neither graph has a cycle; in a cyclic graph a simple path would stop before revisiting a node. External packages, tests, root tooling configs, dynamic `import()`, CommonJS calls, and framework-injected dependencies are outside this measure. In particular, `instrumentation.ts` dynamically loads node telemetry, so this is not a complete runtime dependency graph or bundler size estimate.

## Exported symbols by source module

These measurements were freshly parsed from committed source modules. They count explicit top-level exported bindings, including types, constants, functions, and Next.js default exports. `default` counts once under that name; local non-exported helpers do not count. There are no source re-export declarations to expand. These are module-boundary symbols, not necessarily supported public APIs.

Across the single package’s 41 source modules: **99 exports = 77 value bindings + 22 type-only declarations**; **35 modules export something**, and six command-line entrypoints export nothing.

| Module | Exports | Exported names |
| --- | ---: | --- |
| `app/api/health/route.ts` | 2 | `dynamic`, `GET` |
| `app/api/orders/route.ts` | 2 | `dynamic`, `POST` |
| `app/checkout/page.tsx` | 2 | `metadata`, `default` |
| `app/error.tsx` | 1 | `default` |
| `app/global-error.tsx` | 1 | `default` |
| `app/layout.tsx` | 2 | `metadata`, `default` |
| `app/orders/[id]/page.tsx` | 2 | `metadata`, `default` |
| `app/page.tsx` | 1 | `default` |
| `components/Analytics.tsx` | 1 | `Analytics` |
| `components/CartDrawer.tsx` | 1 | `CartDrawer` |
| `components/CartProvider.tsx` | 2 | `CartProvider`, `useCart` |
| `components/Checkout.tsx` | 1 | `Checkout` |
| `components/MenuAnnouncement.tsx` | 1 | `MenuAnnouncement` |
| `components/OrderConfirmation.tsx` | 1 | `OrderConfirmation` |
| `components/OrderLines.tsx` | 1 | `OrderLines` |
| `components/ProductCard.tsx` | 1 | `ProductCard` |
| `components/PromoCodeField.tsx` | 1 | `PromoCodeField` |
| `components/SiteHeader.tsx` | 1 | `SiteHeader` |
| `components/Storefront.tsx` | 1 | `default` |
| `components/lastOrder.ts` | 2 | `saveLastOrder`, `loadLastOrder` |
| `components/posthog.ts` | 4 | `loadAnalytics`, `track`, `captureError`, `useFeatureFlag` |
| `instrumentation.ts` | 1 | `register` |
| `lib/analytics.ts` | 10 | `ANALYTICS_EVENTS`, `AnalyticsEvent`, `FEATURE_FLAGS`, `FeatureFlag`, `AnalyticsProperties`, `ReleaseInfo`, `releaseProperties`, `productAddedProperties`, `cartProperties`, `orderProperties` |
| `lib/cart.ts` | 4 | `addItem`, `changeQuantity`, `countItems`, `parseStoredCart` |
| `lib/currency.ts` | 1 | `formatCurrency` |
| `lib/orders.ts` | 11 | `PickupSlotId`, `PickupSlot`, `PICKUP_SLOTS`, `MAX_NAME_LENGTH`, `MAX_LINE_QUANTITY`, `OrderRequest`, `Order`, `OrderValidation`, `validateOrderRequest`, `buildOrder`, `pickupLabel` |
| `lib/pricing.ts` | 5 | `BULK_DISCOUNT_THRESHOLD`, `BULK_DISCOUNT_RATE`, `calculateLineTotal`, `priceLines`, `calculateCartTotal` |
| `lib/products.ts` | 4 | `CATEGORIES`, `PRODUCTS`, `getProduct`, `productsInCategory` |
| `lib/promotions.ts` | 3 | `Promotion`, `PROMOTIONS`, `findPromotion` |
| `lib/types.ts` | 6 | `ProductCategory`, `Product`, `Category`, `CartItem`, `PricedLine`, `Cart` |
| `scripts/check-agents-md.mjs` | 0 | None |
| `scripts/ci-test-summary.mjs` | 0 | None |
| `scripts/grafana-alert-issues.mjs` | 0 | None |
| `scripts/grafana-sync.mjs` | 0 | None |
| `scripts/lib/github-issues.mjs` | 3 | `ensureLabel`, `findIssueByMarker`, `upsertIssue` |
| `scripts/posthog-error-issues.mjs` | 0 | None |
| `scripts/todo-report.mjs` | 0 | None |
| `server/instrumentation-node.ts` | 1 | `registerNodeTelemetry` |
| `server/logger.ts` | 10 | `LogLevel`, `LogFields`, `LogWriter`, `Logger`, `LoggerOptions`, `REDACTED`, `isSensitiveKey`, `redact`, `createLogger`, `logger` |
| `server/release.ts` | 2 | `SERVICE_NAME`, `serverRelease` |
| `server/telemetry.ts` | 7 | `RejectionReason`, `recordOrderPlaced`, `recordOrderRejected`, `recordHealthCheck`, `captureServerError`, `flushTelemetry`, `withTelemetry` |

## Reproducing and interpreting the snapshot

Use the pinned commit above, enumerate tracked files with `git ls-tree`, and read blobs with `git show`; apply the category definitions before summing physical lines. `git log HEAD` includes all reachable branches already merged, unlike `--first-parent`. For attribution, inspect author metadata and actual coauthor trailers, not commit subjects. For churn, use `git rev-list --no-merges --since=2026-08-15T00:00:00Z --until=2026-11-13T00:00:00Z HEAD` followed by per-commit `git diff-tree --root --no-commit-id --numstat -r`.

The measurements are a one-time snapshot, not a committed analyzer or a live dashboard. No dependency freshness, production traffic, test execution, incident count, or unrecorded development activity is inferred. [Lore](lore.md) connects these counts to the actual commits.
