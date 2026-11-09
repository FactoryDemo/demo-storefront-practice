---
name: storefront-qa
description: Manually QA the Bean & Byte storefront end to end. Starts the dev server, adds three of one item, confirms that line is 10% off in the cart drawer, places a pickup order through checkout, and checks GET /api/health. Use after changing pricing, cart, checkout, or UI code, or when asked to verify the app works in a browser.
---

# Storefront QA

Use this to confirm the storefront works for a real user after a change.
No login, credentials, or environment variables are needed.

## 1. Start the app

```bash
npm ci
npm run dev
```

Wait for `Ready` in the output, then open http://localhost:3000. If port
3000 is busy, see `docs/runbooks/local-development.md`.

## 2. Check the menu

- The page heading reads "Bean & Byte", with a large product photo beside it.
- The menu has four sections: Hot coffee, Cold, Beans, and Bakery.
- Each product card shows a photo, a name, a price (Drip Coffee is $3.50), a
  short description, and an "Add to cart" button.
- The header's cart button shows 0.

## 3. Add three of one item

- Click "Add to cart" on Drip Coffee three times. The card shows "3 in cart"
  and the header's cart button shows 3.
- Open the cart from the header. The drawer shows one Drip Coffee line with
  quantity 3, marked "10% off this line".
- That line is 10% off: 3 × $3.50 = $10.50, so the line shows **$9.45**.

## 4. Check the cart total

- With only that line, the Total row shows **$9.45**.
- Add one Espresso ($2.95). Its line stays at full price ($2.95) and the
  total becomes **$12.40**.
- Click "−" on Drip Coffee once. Quantity 2 is below the threshold, so the
  line becomes $7.00 and the total $9.95. Click "+" to go back to 3.
- Reload the page. The cart keeps its items (it is saved in localStorage).

## 5. Place an order

- In the cart drawer, click **Checkout**.
- The order summary matches the cart, with a "10% off" tag on the Drip
  Coffee line and a total of $12.40.
- Enter a name, choose a pickup time, and click **Place order · $12.40**.
- The confirmation page shows an order number (`BB-` and six characters),
  "Thanks, <name>", the pickup time, the same lines, and $12.40. The header
  cart is back to 0.
- The dev server log shows one JSON line with `"message":"order placed"`
  and the total in cents. The customer's name is not logged.

## 6. Check the health endpoint

```bash
curl localhost:3000/api/health
```

Expect HTTP 200 with `{"status":"ok"}`. The dev server log shows one JSON
line with `"message":"health check"`.

## Report

State what you checked, the amounts you saw, and anything that did not
match. The automated version of these steps is `npm run test:e2e`.
