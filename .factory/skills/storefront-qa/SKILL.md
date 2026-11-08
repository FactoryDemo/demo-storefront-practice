---
name: storefront-qa
description: Manually QA the Bean & Byte storefront in a browser. Use after changing the catalog, cart, pricing, or currency display to confirm the app runs, the bulk discount shows on a cart line, and the health endpoint responds.
---

# Storefront QA

Bring the app up locally and exercise the catalog, cart, and pricing end to
end. No login, accounts, or external services are needed.

## 1. Start the app

```bash
npm ci
npm run dev
```

Wait for `Ready` in the output. The app serves http://localhost:3000. If the
port is busy or the build looks stale, follow
`docs/runbooks/local-development.md`.

## 2. Check the health endpoint

```bash
curl localhost:3000/api/health
```

Expect HTTP 200 and the body `{"status":"ok"}`. The dev server log prints a
JSON line with `"message":"health check"`.

## 3. Exercise the storefront

Open http://localhost:3000 in a browser (or drive it with a browser
automation tool) and check each step:

1. The header reads "Bean & Byte" and the catalog shows products with
   prices, for example Drip Coffee at $3.50.
2. The cart says "Nothing here yet" before anything is added.
3. Click **Add to cart** on Drip Coffee three times.
4. The Drip Coffee cart line shows quantity 3 and **$9.45**: 3 × $3.50 is
   $10.50, and three or more of one item takes 10% off that line.
5. Click **+** to make it 4 and expect $12.60 (4 × $3.50 = $14.00, less 10%).
   Click **−** back to 2 and expect $7.00, with no discount.
6. Add one Cold Brew ($4.25). The Cold Brew line stays at full price, and the
   cart **Total** equals the sum of the line totals.

## 4. Report

List each step as pass or fail, with the amounts you saw. For a failure,
include the cart contents and the expected and actual amounts, and run
`npm test` to see whether a pricing unit test catches it.
