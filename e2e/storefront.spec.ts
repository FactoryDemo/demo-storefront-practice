import { expect, test, type Page } from "@playwright/test";

async function openStorefront(page: Page): Promise<void> {
  await page.goto("/");
  // Clicks before React hydrates are dropped, so wait for the client bundle.
  await page.waitForLoadState("networkidle");
}

async function addToCart(page: Page, name: string, times = 1): Promise<void> {
  const button = page
    .locator(".product-card")
    .filter({ has: page.getByText(name, { exact: true }) })
    .getByRole("button", { name: "Add to cart" });
  for (let click = 0; click < times; click += 1) {
    await button.click();
  }
}

async function openCart(page: Page) {
  await page.getByRole("button", { name: /^Cart, / }).click();
  const cart = page.getByRole("dialog", { name: "Your cart" });
  await expect(cart).toBeVisible();
  return cart;
}

test("home page shows the menu by category", async ({ page }) => {
  await openStorefront(page);

  await expect(
    page.getByRole("heading", { level: 1, name: /Bean & Byte/ })
  ).toBeVisible();
  for (const category of ["Hot coffee", "Cold", "Beans", "Bakery"]) {
    await expect(
      page.getByRole("heading", { level: 2, name: category, exact: true })
    ).toBeVisible();
  }
  await expect(page.getByText("Drip Coffee", { exact: true })).toBeVisible();
  await expect(page.getByText("$3.50", { exact: true })).toBeVisible();
  expect(
    await page.getByRole("button", { name: "Add to cart" }).count()
  ).toBeGreaterThan(10);
  await expect(
    page.getByRole("button", { name: "Cart, 0 items" })
  ).toBeVisible();
});

test("three of one item get 10% off that cart line", async ({ page }) => {
  await openStorefront(page);
  await addToCart(page, "Drip Coffee", 3);
  await expect(
    page.getByRole("button", { name: "Cart, 3 items" })
  ).toBeVisible();

  const cart = await openCart(page);
  const dripLine = cart
    .locator(".cart-line")
    .filter({ has: page.getByRole("button", { name: "Add one Drip Coffee" }) });
  // 3 x $3.50 = $10.50 gross; 10% off the line is $9.45.
  await expect(dripLine).toContainText("$9.45");
  await expect(dripLine).not.toContainText("$10.50");
  await expect(cart.locator(".cart-total")).toContainText("$9.45");
});

test("the cart survives a page reload", async ({ page }) => {
  await openStorefront(page);
  await addToCart(page, "Latte", 2);
  await page.reload();
  await page.waitForLoadState("networkidle");

  await expect(
    page.getByRole("button", { name: "Cart, 2 items" })
  ).toBeVisible();
});

test("checkout places a pickup order and shows the confirmation", async ({
  page,
}) => {
  await openStorefront(page);
  await addToCart(page, "Drip Coffee", 3);
  await addToCart(page, "Espresso");

  const cart = await openCart(page);
  await expect(cart.locator(".cart-total")).toContainText("$12.40");
  await cart.getByRole("link", { name: "Checkout" }).click();

  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByLabel("Name for the order").fill("Ada");
  await page.getByLabel("Pickup time").selectOption("in-15");
  await page.getByRole("button", { name: "Place order · $12.40" }).click();

  await expect(page).toHaveURL(/\/orders\/BB-[0-9A-F]{6}$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Thanks, Ada. Your order is in.",
    })
  ).toBeVisible();
  await expect(page.getByText("In 15 minutes")).toBeVisible();
  await expect(page.locator(".order-total")).toContainText("$12.40");
  await expect(
    page.getByRole("button", { name: "Cart, 0 items" })
  ).toBeVisible();
});

test("POST /api/orders recomputes totals and rejects bad orders", async ({
  request,
}) => {
  const placed = await request.post("/api/orders", {
    data: {
      name: "Ada",
      pickup: "asap",
      items: [{ productId: "drip", quantity: 3 }],
    },
  });
  expect(placed.status()).toBe(201);
  expect(await placed.json()).toMatchObject({ totalCents: 945 });

  const rejected = await request.post("/api/orders", {
    data: { name: "", pickup: "asap", items: [] },
  });
  expect(rejected.status()).toBe(400);
  expect((await rejected.json()).errors).toHaveLength(2);
});

test("GET /api/health returns ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

test("SAVE10 survives reload and checkout, then clears with the order", async ({
  page,
}) => {
  await openStorefront(page);
  await addToCart(page, "Drip Coffee", 3);
  await addToCart(page, "Espresso");
  let cart = await openCart(page);
  await cart.getByLabel("Promo code", { exact: true }).fill("  save10  ");
  await cart.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(cart.getByRole("status")).toHaveText("SAVE10 applied");
  await expect(cart.locator(".promo-discount")).toContainText("-$1.24");
  await expect(cart.locator(".cart-total")).toContainText("$11.16");
  await expect(cart.locator(".cart-line").first()).toContainText("$9.45");

  await page.reload();
  await page.waitForLoadState("networkidle");
  cart = await openCart(page);
  await expect(cart.getByRole("status")).toHaveText("SAVE10 applied");
  await expect(cart.locator(".cart-total")).toContainText("$11.16");
  await cart.getByRole("link", { name: "Checkout" }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.locator(".order-total")).toContainText("$11.16");
  await page.reload();
  await expect(page.locator(".order-total")).toContainText("$11.16");
  await expect(page.locator(".promo-discount")).toContainText("SAVE10");
  await page.getByLabel("Name for the order").fill("Ada");

  const placed = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/orders") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Place order · $11.16" }).click();
  const response = await placed;
  expect(response.status()).toBe(201);
  expect(await response.json()).toMatchObject({
    totalCents: 1116,
    promoCode: "SAVE10",
  });
  await expect(page).toHaveURL(/\/orders\/BB-[0-9A-F]{6}$/);
  await expect(page.locator(".order-total")).toContainText("$11.16");
  await expect(page.locator(".promo-discount")).toContainText("-$1.24");
  await page.reload();
  await expect(page.locator(".order-total")).toContainText("$11.16");
  await expect(page.locator(".promo-discount")).toContainText("SAVE10");

  await page.getByRole("link", { name: "Start a new order" }).click();
  await addToCart(page, "Drip Coffee");
  cart = await openCart(page);
  await expect(cart.getByLabel("Promo code", { exact: true })).toHaveValue("");
  await expect(cart.locator(".cart-total")).toContainText("$3.50");
  await expect(cart.locator(".promo-discount")).toHaveCount(0);
});

test("promo input validates, recalculates quantities, and supports removal", async ({
  page,
}) => {
  await openStorefront(page);
  await addToCart(page, "Drip Coffee");
  const cart = await openCart(page);
  const input = cart.getByLabel("Promo code", { exact: true });
  await cart.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(cart.getByRole("alert")).toHaveText(
    "Promo code is not recognized."
  );
  await input.fill("NOT-A-CODE");
  await cart.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(cart.locator(".cart-total")).toContainText("$3.50");
  await input.fill("SAVE10");
  await input.press("Enter");
  await expect(cart.locator(".cart-total")).toContainText("$3.15");

  await cart.getByRole("button", { name: "Add one Drip Coffee" }).click();
  await expect(cart.locator(".cart-total")).toContainText("$6.30");
  await cart.getByRole("button", { name: "Add one Drip Coffee" }).click();
  await expect(cart.locator(".cart-total")).toContainText("$8.50");
  await expect(cart.locator(".promo-discount")).toContainText("-$0.95");
  await cart.getByRole("button", { name: "Remove one Drip Coffee" }).click();
  await expect(cart.locator(".cart-total")).toContainText("$6.30");
  await cart.getByRole("button", { name: "Remove promo code" }).click();
  await expect(cart.locator(".cart-total")).toContainText("$7.00");
  await expect(cart.locator(".promo-discount")).toHaveCount(0);

  await input.fill("SAVE10");
  await input.press("Enter");
  await expect(cart.locator(".cart-total")).toContainText("$6.30");
  await cart.getByRole("button", { name: "Remove promo code" }).click();
  await page.reload();
  await page.waitForLoadState("networkidle");
  const reloadedCart = await openCart(page);
  await expect(reloadedCart.locator(".cart-total")).toContainText("$7.00");
  await reloadedCart.getByRole("link", { name: "Checkout" }).click();
  await expect(page.locator(".order-total")).toContainText("$7.00");
});

test("orders API validates promo codes and re-prices discounts on the server", async ({
  request,
}) => {
  const order = {
    name: "Ada",
    pickup: "asap",
    items: [
      { productId: "drip", quantity: 1, priceCents: 1 },
      { productId: "drip", quantity: 2, lineTotalCents: 1 },
      { productId: "espresso", quantity: 1 },
    ],
    totalCents: 1,
    discountCents: 999999,
  };
  const placed = await request.post("/api/orders", {
    data: { ...order, promoCode: " save10 " },
  });
  expect(placed.status()).toBe(201);
  expect(await placed.json()).toMatchObject({
    promoCode: "SAVE10",
    totalCents: 1116,
    lines: [
      { productId: "drip", quantity: 3, lineTotalCents: 945 },
      { productId: "espresso", quantity: 1, lineTotalCents: 295 },
    ],
  });

  for (const promoCode of ["SAVE100", null, 10, ["SAVE10"]]) {
    const rejected = await request.post("/api/orders", {
      data: { ...order, promoCode },
    });
    expect(rejected.status()).toBe(400);
    expect((await rejected.json()).errors).toHaveLength(1);
  }
});
