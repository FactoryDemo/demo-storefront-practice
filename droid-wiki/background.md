# Design choices

The repository is a small practice storefront, not a production commerce backend. Its main boundaries make pricing changes easy to trace and test (`README.md`, `AGENTS.md`, `docs/architecture.md`).

## Pure core, shared rules

`lib/` contains no React or I/O by project rule. `lib/pricing.ts` owns line/cart totals, while `lib/orders.ts` validates input and constructs orders using that same pricing code.

This keeps browser summaries and server totals on one implementation. It also permits Node-only unit tests without mounting UI (`vitest.config.ts`, `tests/pricing.test.ts`, `tests/orders.test.ts`). Calling the same core does not remove the server trust boundary: the API still derives prices from the catalog rather than accepting a client total.

## Two browser stores, different lifetimes

`components/CartProvider.tsx` uses localStorage so shopping can survive a page reload. Its hydration flag prevents the initial empty state from overwriting saved items before they are read.

`components/lastOrder.ts` uses sessionStorage for the latest confirmation. There is no server repository, database record, or order lookup route. That choice keeps the demo small, but means the URL alone cannot recover an order. Browser storage is convenience state, not trusted commerce data. See [checkout](features/checkout.md) and [security boundaries](security.md).

## Optional instrumentation

`components/posthog.ts` dynamically imports the browser SDK only when configured. `server/instrumentation-node.ts` enables exporters and profiles through environment variables. Missing profiler binaries produce a warning rather than stopping checkout.

The repository explicitly supports local development without these services (`.env.example`, `docs/runbooks/local-development.md`). New features must still work with all flags off (`AGENTS.md`).

## Code as operational configuration

Grafana dashboards and alerts live in `observability/grafana/`, applied through `.github/workflows/observability.yml`. Deployment recording and issue creation are separate workflows from application request handling.

The wiki refresh follows the same separation: `.github/workflows/droid-wiki-refresh.yml` gives generation read-only permissions and reserves repository writes for a separate publish job. This documents a permission boundary, not a claim that generated content is inherently trusted.

For dated evolution rather than implementation rationale, see [lore](lore.md). For the current wiring, see [architecture](overview/architecture.md).
