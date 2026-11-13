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

test("SAVE10 discounts the cart and checkout total", async ({ page }) => {
  await openStorefront(page);
  await addToCart(page, "Drip Coffee", 2);

  const cart = await openCart(page);
  await cart.getByLabel("Promo code").fill("save10");
  await cart.getByRole("button", { name: "Apply" }).click();
  await expect(cart.getByRole("status")).toContainText(
    "SAVE10 applied: 10% off your order."
  );
  await expect(cart.locator(".cart-promo-discount")).toContainText("−$0.70");
  await expect(cart.locator(".cart-total")).toContainText("$6.30");
  await cart.getByRole("link", { name: "Checkout" }).click();

  await expect(
    page.getByRole("button", { name: "Place order · $6.30" })
  ).toBeVisible();
  await page.getByLabel("Name for the order").fill("Ada");
  await page.getByRole("button", { name: "Place order · $6.30" }).click();
  await expect(page).toHaveURL(/\/orders\/BB-[0-9A-F]{6}$/);
  await expect(page.locator(".order-promo-discount")).toContainText("−$0.70");
  await expect(page.locator(".order-total")).toContainText("$6.30");
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
