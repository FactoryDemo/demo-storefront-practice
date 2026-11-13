# Lore

Bean & Byte's November 12 historical snapshot contained **42 commits from 2026-11-01 to 2026-11-12**, ending at [`e9d6df4`](https://github.com/FactoryDemo/demo-storefront-practice/commit/e9d6df400272dc8e53f15eb848b92917697b547a). The account below preserves that snapshot and notes the subsequent November 13 automation update. It comes from the complete reachable Git log, commit diffs, historical blobs, and blame, rather than reconstructed release notes or assumed motivations. Dates are recorded commit dates. See [by the numbers](by-the-numbers.md) for current counts and [design choices](background.md) for current boundaries.

## 2026-11-01: A five-item storefront and a pricing core

The [seed commit, `2f9a365`](https://github.com/FactoryDemo/demo-storefront-practice/commit/2f9a36540eca03ab34319e3146db985190511741), already contained the recognizable business rule: buying three or more of one item makes that line 10% off. `lib/pricing.ts` used nearest-cent `Math.round`; `lib/currency.ts` formatted USD; `tests/pricing.test.ts` covered pricing. CI existed in `.github/workflows/ci.yml` from the start.

The original `lib/products.ts` had five emoji-decorated products: Espresso, Drip Coffee, Latte, Cold Brew, and Bag of Beans. `components/Storefront.tsx` owned its own `useState` cart and rendered an inline cart panel. There was no pickup checkout in that tree.

**What has weathered the changes?** The bulk threshold of three and rate of 10% still blame to the root commit after **41 subsequent repository commits**. `lib/currency.ts` has only its initial non-merge commit in its path history: its implementation survived those 41 commits unchanged. This counts intervening repository commits, not 41 edits to either feature.

## 2026-11-02: Automated review arrives

[`4cd074e`](https://github.com/FactoryDemo/demo-storefront-practice/commit/4cd074eff00bca4f4292f9a65401618466bab5c3) added `.github/workflows/droid.yml`, and [`cd97f83`](https://github.com/FactoryDemo/demo-storefront-practice/commit/cd97f834ec0e63a7a59323675ca166b5d81bfe92) added a [separate review workflow](https://github.com/FactoryDemo/demo-storefront-practice/blob/cd97f834ec0e63a7a59323675ca166b5d81bfe92/.github/workflows/droid-review.yml). A [README change, `dfff38d`](https://github.com/FactoryDemo/demo-storefront-practice/commit/dfff38ddedfd884b5af238c3a0af1641e1881730), then documented automatic PR review.

That separate review workflow was later removed, and review versus mention handling was reorganized again. These historical files are not a current setup recipe. The eventual workflow boundaries are described in [tooling](how-to-contribute/tooling.md).

## 2026-11-05–2026-11-06: Rounding changes, then returns

[`ee0a82d` on November 5](https://github.com/FactoryDemo/demo-storefront-practice/commit/ee0a82d4efb72fec34dea4f74284de3b20ce3bc8) replaced `Math.round` with `Math.floor` in `lib/pricing.ts`. [`7da6e85` on November 6](https://github.com/FactoryDemo/demo-storefront-practice/commit/7da6e853df37c364869799ce2ef847f6479bd7be) reversed that exact line, restoring nearest-cent rounding. For three Espressos, the discounted 796.5 cents therefore briefly rounded down to 796 rather than the current 797 cents. Git shows the change and restoration; it does not establish a broader deprecation policy or an external reason for either.

The same day, [`106dd59`](https://github.com/FactoryDemo/demo-storefront-practice/commit/106dd59590060ea3a940a3f8a6f0d9a91bc64bd6) replaced the direct cart-total reduction with `priceLines` plus a subtotal and optional promotion lookup. It introduced `lib/promotions.ts` and the `PricedLine` type in `lib/types.ts`. That is a genuine pricing refactor, not a new checkout feature: the promotion registry was empty in that November 6 tree, and checkout did not yet have a promotion-code field or API support. The November 12 SAVE10 milestone below added those, was reverted as a rehearsal, then returned and was reverted a second time later that day.

[`2782697`](https://github.com/FactoryDemo/demo-storefront-practice/commit/2782697d8b0988d0cb6f9c8177bbad9618544f7b) added secret-provided finance checkout rules to `.github/workflows/ci.yml`. Their contents are not in the repository, so this history cannot enumerate their rules. Through November 6, `lib/pricing.ts` had **four touching non-merge commits**: the seed, the rounding change, its restoration, and the promotion refactor. The November 12 SAVE10 rehearsal, first reversion, reintroduction, and second reversion bring its snapshot total to **eight**; blame still identifies the restored bulk-rounding line with [`7da6e85`](https://github.com/FactoryDemo/demo-storefront-practice/commit/7da6e853df37c364869799ce2ef847f6479bd7be).

## 2026-11-08: Quality and operational scaffolding expands

[`c6ad72c`](https://github.com/FactoryDemo/demo-storefront-practice/commit/c6ad72c1c7f496f650e53c765468795e27c0f8f4) added ESLint, Prettier, ownership/configuration files, and development-container setup. [`89de6c4`](https://github.com/FactoryDemo/demo-storefront-practice/commit/89de6c45cd6d4922bb88763bc185028814025a6d) then added coverage gates, Playwright testing, the health endpoint, logger and logger tests, documentation, reporting scripts, and additional workflows.

This is where `app/api/health/route.ts`, `server/logger.ts`, `e2e/storefront.spec.ts`, and `docs/runbooks/local-development.md` enter the tree. Later commits enriched some of them; their presence here does not mean the full current observability stack already existed.

Dependency automation also changed that day: [`2582ce0`](https://github.com/FactoryDemo/demo-storefront-practice/commit/2582ce0b922b4d8b46590dbe485bf57cd2c5cd82) added major-update ignores to `.github/dependabot.yml`, and [`9557991`](https://github.com/FactoryDemo/demo-storefront-practice/commit/9557991e8a24d912e734b788a6c9975fdf60e771) excluded Dependabot PRs from Droid review. The repository records these policy changes without proving a general claim about all dependency upgrades.

## 2026-11-08: The storefront is rewritten around pickup checkout

The [redesign commit, `7e1721f`](https://github.com/FactoryDemo/demo-storefront-practice/commit/7e1721ffebfd321eda8c568b73ec72431782a918), replaced the emoji menu and inline cart with product photography, categories, a shared cart provider, a drawer, checkout, and order confirmation.

The old local cart mutation helpers inside `components/Storefront.tsx` gave way to `components/CartProvider.tsx` and pure operations in `lib/cart.ts`. Cart persistence moved beyond component lifetime through local storage. New files included `components/Checkout.tsx`, `components/lastOrder.ts`, `components/OrderConfirmation.tsx`, `lib/orders.ts`, and `app/api/orders/route.ts`. The server validated and re-priced mock pickup orders; this was not the introduction of payments or durable order storage.

`lib/products.ts` grew from **five products to 13**, with **four categories** and **13 JPEG assets** in `public/products/`. `app/globals.css` and `components/Storefront.tsx` were substantially rewritten, and `e2e/storefront.spec.ts` was expanded for the new flow. The early inline-cart experience is replaced behavior, not a separately supported legacy mode. See [catalog](features/catalog.md), [cart and pricing](features/cart-pricing.md), and [pickup checkout](features/checkout.md).

## 2026-11-09: Optional telemetry becomes a cross-cutting layer

[`f7f3790`](https://github.com/FactoryDemo/demo-storefront-practice/commit/f7f3790021ce447bdd284bd610fcf4b5674ab5ad) added browser analytics and feature flags, error tracking, server metrics, profiling, alert automation, and deployment markers.

The source additions include `lib/analytics.ts`, `components/posthog.ts`, `components/Analytics.tsx`, `server/instrumentation-node.ts`, `server/telemetry.ts`, and `server/release.ts`. Operational additions include `scripts/posthog-error-issues.mjs`, `scripts/grafana-alert-issues.mjs`, `scripts/grafana-sync.mjs`, and `observability/grafana/`. The existing health and order routes were updated to use telemetry rather than being replaced by new business endpoints.

This commit also introduced React error boundaries and `docs/runbooks/observability.md`. Integrations remain configuration-dependent, and local checkout still works without external credentials. See [monitoring](how-to-monitor/index.md) for the current signal destinations.

## 2026-11-09–2026-11-12: Review orchestration changes, and the wiki becomes automated

Review orchestration was repeatedly revised rather than simply accumulating workflows:

- **November 9:** [`730ad0c`](https://github.com/FactoryDemo/demo-storefront-practice/commit/730ad0c6704502ebc301dec30283d717f1234b54) moved review behind passing CI/finance rules and deleted the separate review workflow. [`a1bc510`](https://github.com/FactoryDemo/demo-storefront-practice/commit/a1bc510289a1d57b4fb96023798af60f62f67577) moved orchestration back into `.github/workflows/droid.yml` while preserving the test gate. [`f38bbd9`](https://github.com/FactoryDemo/demo-storefront-practice/commit/f38bbd9745316586e3af3319879219b8810b0d4b) separately instructed agents in `AGENTS.md` to stop after opening a PR instead of waiting on CI.
- **November 10:** [`4165c92`](https://github.com/FactoryDemo/demo-storefront-practice/commit/4165c92d3f7fdea7ec8c3f2b92f0b447b5353f03) separated mention handling into `.github/workflows/droid-tag.yml`, leaving `.github/workflows/droid.yml` review-only.
- **November 11:** [`26b1e81`](https://github.com/FactoryDemo/demo-storefront-practice/commit/26b1e8173d8bffd02a689157f1a7e1e991eed0cf) added specific Dependabot ignores for compatibility constraints. [`041984d`](https://github.com/FactoryDemo/demo-storefront-practice/commit/041984dcfa6aa9cd3446dda7bbeb296d1e6f40d7) removed the CI polling/gating steps so review could run alongside CI even on a failing PR. That replacement is explicit in the diff's workflow comments.
- **November 12:** [`902a299`](https://github.com/FactoryDemo/demo-storefront-practice/commit/902a299dca0038fcfb243854170ec73b89f89d9e) added `.github/workflows/droid-wiki-refresh.yml`: read-only generation, restoration from a rolling wiki branch, an artifact handoff, and a separate write-enabled publish job. This records automation being added, not evidence that every scheduled or triggered run succeeded. The same day, [`3c5575c`](https://github.com/FactoryDemo/demo-storefront-practice/commit/3c5575cfdba7a787f77a313b622e4cff70d9596f) committed the first tracked `droid-wiki/` snapshot: 31 Markdown pages and metadata, with no application-source changes.

- **November 12:** [`11789b4`](https://github.com/FactoryDemo/demo-storefront-practice/commit/11789b48e07aaee25433cc2f67bb15e101c401a5) added wiki-only push exclusions and requested squash auto-merge for the generated PR in `.github/workflows/droid-wiki-refresh.yml`, with a warning if the request fails. [`c153cf5`](https://github.com/FactoryDemo/demo-storefront-practice/commit/c153cf561070227aa3207b16bf534fd4cdade1bd) then refreshed the tracked wiki. Auto-merge being requested is not evidence that branch-protection requirements were bypassed or that every later run merged.

The later [tracked-tree restoration on November 12](https://github.com/FactoryDemo/demo-storefront-practice/commit/e9d6df400272dc8e53f15eb848b92917697b547a) removed both the wiki-only push exclusions and the auto-merge request steps. The [November 13 wiki refresh](https://github.com/FactoryDemo/demo-storefront-practice/commit/75fc56bcf97d4ee9927a5e285329f83be3a974af) restored both in `.github/workflows/droid-wiki-refresh.yml`. Its committer timestamp is **2026-11-13 01:02:19 UTC**, while its author timestamp is November 12 at 20:02:19 −05:00. Wiki-only pushes are excluded again, and generated PRs request squash auto-merge subject to required checks and reviews. See [deployment](deployment.md) for current publication behavior.

## 2026-11-12: SAVE10 rehearsal, reintroduction, and two reversions

At **13:33:57 −05:00**, [`b83863d`](https://github.com/FactoryDemo/demo-storefront-practice/commit/b83863dbfa7836f5215e9672534cc57a9b828baa) populated `lib/promotions.ts` with SAVE10, a 10% discount on non-bulk lines. In that historical tree, `lib/pricing.ts` filtered every bulk-priced line out before calling a promotion's discount function, the rule labeled FIN-212 in the code. SAVE10 rounded its discount once on the eligible subtotal; the existing per-line bulk discount remained unchanged. This describes that commit's visible source behavior, not current functionality or the contents of secret-provided finance checks.

The historical shared field in [`components/PromoCodeField.tsx`](https://github.com/FactoryDemo/demo-storefront-practice/blob/b83863dbfa7836f5215e9672534cc57a9b828baa/components/PromoCodeField.tsx) appeared in the cart drawer and checkout. `components/CartProvider.tsx` persisted its value in local storage and reset it when the cart was cleared after a successful order. `lib/orders.ts` validated and normalized the optional code, and server order construction re-priced it rather than trusting a browser total. This introduced no database, payments, or authentication.

The introduction changed **12 files, with 322 additions and 24 deletions**. It added the historical [`tests/promotions.test.ts`](https://github.com/FactoryDemo/demo-storefront-practice/blob/b83863dbfa7836f5215e9672534cc57a9b828baa/tests/promotions.test.ts) and expanded `tests/pricing.test.ts`, `tests/orders.test.ts`, and `e2e/storefront.spec.ts` for promotions, mixed bulk/non-bulk eligibility, and the checkout flow.

At **13:39:08 −05:00**, [`3461fc3`](https://github.com/FactoryDemo/demo-storefront-practice/commit/3461fc30f6b24b1cc8a7497bdfcd9e34c9bc90df), titled “revert save10 rehearsal #24,” reversed that change: **12 files, 24 additions and 322 deletions**. It deleted the shared field and dedicated promotion test, removed promo state and persistence from the provider, removed the order request field, and removed the non-stacking filter. In that reverted tree, the registry was empty again. The optional `calculateCartTotal` promotion hook in `lib/pricing.ts` predated SAVE10 and remained dormant until the later reintroduction. Three Drip Coffees plus one Espresso again totaled **1,240 cents ($12.40)**, with only the coffee line's bulk discount. The title records a rehearsal reversion; Git does not establish any further motivation. See [cart and pricing](features/cart-pricing.md) and [pickup checkout](features/checkout.md) for current behavior.

At **15:27:30 −05:00** on **November 12**, [`e0462e9`](https://github.com/FactoryDemo/demo-storefront-practice/commit/e0462e94b0cfa8c89bd419994343526e3800fc53), “add SAVE10 order promotion (#27),” reintroduced the active promotion in **17 files, with 480 additions and 31 deletions**. The historical [`components/PromoCodeField.tsx`](https://github.com/FactoryDemo/demo-storefront-practice/blob/e0462e94b0cfa8c89bd419994343526e3800fc53/components/PromoCodeField.tsx) returned to the cart and checkout, `components/CartProvider.tsx` restored persisted promo state, and `lib/orders.ts` restored optional-code validation and server repricing. `components/OrderLines.tsx` and `components/OrderConfirmation.tsx` displayed the resulting discount; `lib/analytics.ts` reported promotion-aware totals.

This was not an exact replay of the rehearsal. The visible FIN-212 non-stacking filter lived inside SAVE10’s `discountCents` implementation in `lib/promotions.ts`, rather than in the generic promotion dispatch in `lib/pricing.ts`. It selected full-price lines, totaled their cents, and rounded the 10% discount once using integer quotient and remainder. The historical [`tests/promotions.test.ts`](https://github.com/FactoryDemo/demo-storefront-practice/blob/e0462e94b0cfa8c89bd419994343526e3800fc53/tests/promotions.test.ts) checked that implementation directly, including bulk-only orders and rounding across eligible lines. `tests/pricing.test.ts`, `tests/orders.test.ts`, `tests/analytics.test.ts`, and `e2e/storefront.spec.ts` covered its integrations. These are source and test facts, not a claim about hidden finance rules or CI results.

In that **15:27:30 −05:00 historical tree**, three Drip Coffees plus one Espresso cost **1,240 cents without a code** and **1,210 cents with SAVE10**: only the Espresso was promo-eligible. Three Espressos still cost **797 cents**, with or without SAVE10. No database, payment service, or accounts were added.

At **20:36:58 UTC (15:36:58 −05:00)** on **November 12**, [`df7bd0f`](https://github.com/FactoryDemo/demo-storefront-practice/commit/df7bd0fbd8dfc3a24a3a4b38d381f88600955014), “docs: refresh wiki (#28),” updated **16 wiki files, with 196 additions and 154 deletions**. It documented the reintroduction without changing application source.

At **15:40:16 −05:00 (20:40:16 UTC)** on **November 12**, [`05be85e`](https://github.com/FactoryDemo/demo-storefront-practice/commit/05be85e2a6da3930a48c3b3a6ebc53d2e2567b40), “revert save10 rehearsal #27,” reversed the reintroduction in **17 files, with 31 additions and 480 deletions**. This is its recorded committer time; its author time was **15:36:43 −05:00**. It deleted the historical [`components/PromoCodeField.tsx`](https://github.com/FactoryDemo/demo-storefront-practice/blob/e0462e94b0cfa8c89bd419994343526e3800fc53/components/PromoCodeField.tsx) and dedicated promotion test again, removed promo UI/state/persistence and order fields, and removed the added promotion assertions from the retained tests. The title and `Rehearsal-Revert` trailer identify a rehearsal reversion; no further motive is established by Git.

At the **2026-11-12 snapshot (`e9d6df4`)**, `PROMOTIONS` in `lib/promotions.ts` is empty, as it was at `05be85e`. The optional `calculateCartTotal(items, promoCode?)` hook in `lib/pricing.ts` predates both SAVE10 rehearsals and remains; it does not make a promotion active. The cart and order flow have no promotion-code field. Three Drip Coffees plus one Espresso total **1,240 cents ($12.40)**; three Espressos total **797 cents**. The intervening committed wiki still described active SAVE10, so it is evidence of an earlier tree, not the current implementation. See [cart and pricing](features/cart-pricing.md) and [pickup checkout](features/checkout.md) for current behavior.

## 2026-11-12: Wiki refresh and tracked-tree restoration

At **20:49:41 UTC (15:49:41 −05:00)**, [`aa05678`](https://github.com/FactoryDemo/demo-storefront-practice/commit/aa056783497ce16d5216a9f6c8c051389110a5de), “docs: refresh wiki (#29),” updated **16 wiki files, with 163 additions and 169 deletions**. Application source was unchanged.

At **20:58:33 UTC (15:58:33 −05:00)**, [`e9d6df4`](https://github.com/FactoryDemo/demo-storefront-practice/commit/e9d6df400272dc8e53f15eb848b92917697b547a), “restore session-start tracked files (#30),” changed **19 files, with 102 additions and 226 deletions**. Its message names the earlier `3461fc3` tree; comparing those two committed trees yields no differences. This restored file contents without removing the intervening reachable commits. Eighteen affected files were wiki pages or metadata; the only non-wiki change removed the 18 lines implementing wiki-only push exclusions and squash auto-merge in `.github/workflows/droid-wiki-refresh.yml`. Source and tests stayed unchanged from the second SAVE10 reversion.

## Growth, 2026-11-01–2026-11-12

Using the same physical-line categories as [by the numbers](by-the-numbers.md), the root-to-`e9d6df4` historical snapshot change is:

| Measure | 2026-11-01 root | 2026-11-12 snapshot |
| --- | ---: | ---: |
| Tracked files, including lock/generated files, wiki, and assets | 19 | 140 |
| Source files / physical lines | 8 / 357 | 41 / 3,342 |
| Test files / physical lines | 1 / 83 | 8 / 776 |
| Configuration/automation files / physical lines | 6 / 80 | 35 / 1,686 |
| Non-wiki Markdown files / physical lines | 2 / 77 | 9 / 586 |
| Tracked wiki files / physical lines, including metadata | 0 / 0 | 32 / 1,733 |
| Product photo assets | 0 | 13 |
| Packages | 1 | 1 |

This is roughly **9.4× the source physical lines**, not 9.4× the functionality or complexity. The longest-lived rule remains the per-product bulk discount; the largest visible rewrite is the November 8 storefront/checkout change. The history shows no package migration or formal public-API deprecation process. There is no basis here for inventing earlier release eras, production incidents, or undocumented motivations.

Evidence can be revisited with `git log --reverse`, `git show <commit> -- <repository-root-path>`, historical blobs such as `git show 2f9a365:components/Storefront.tsx`, and `git blame lib/pricing.ts`. The linked commits distinguish what changed from what the current [architecture](overview/architecture.md) does.
