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

test("SAVE10 survives reloads, checkout, and confirmation, then clears", async ({
  page,
}) => {
  await openStorefront(page);
  await addToCart(page, "Drip Coffee", 3);
  await addToCart(page, "Espresso");
  let cart = await openCart(page);
  await cart.getByLabel("Promo code", { exact: true }).fill("  save10  ");
  await cart.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(cart.getByRole("status")).toContainText(
    "SAVE10 · 10% off the order"
  );
  await expect(cart.getByRole("status")).toContainText("−$0.30");
  await expect(cart.locator(".cart-total")).toContainText("$12.10");
  await expect(cart.locator(".cart-line-total").first()).toHaveText("$9.45");

  await page.reload();
  await page.waitForLoadState("networkidle");
  cart = await openCart(page);
  await expect(cart.getByLabel("Promo code", { exact: true })).toHaveValue(
    "SAVE10"
  );
  await expect(cart.locator(".cart-total")).toContainText("$12.10");
  await cart.getByRole("link", { name: "Checkout" }).click();
  await expect(page.locator(".order-total")).toContainText("$12.10");
  await page.reload();
  await expect(page.getByRole("status")).toContainText("SAVE10");
  await page.getByLabel("Name for the order").fill("Ada");
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/orders") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Place order · $12.10" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  expect(await response.json()).toMatchObject({
    promoCode: "SAVE10",
    totalCents: 1210,
  });
  await expect(page).toHaveURL(/\/orders\/BB-[0-9A-F]{6}$/);
  await expect(page.locator(".order-total")).toContainText("$12.10");
  await expect(page.getByRole("status")).toContainText("−$0.30");
  await page.reload();
  await expect(page.getByRole("status")).toContainText("SAVE10");

  await page.getByRole("link", { name: "Start a new order" }).click();
  await addToCart(page, "Drip Coffee");
  cart = await openCart(page);
  await expect(cart.getByLabel("Promo code", { exact: true })).toHaveValue("");
  await expect(cart.locator(".cart-total")).toContainText("$3.50");
  await expect(cart.getByRole("status")).toHaveCount(0);
});

test("promo validation, reapplication, quantity changes, and removal", async ({
  page,
}) => {
  await openStorefront(page);
  await addToCart(page, "Drip Coffee", 2);
  let cart = await openCart(page);
  const code = cart.getByLabel("Promo code", { exact: true });
  await cart.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(cart.getByRole("alert")).toHaveText("Enter a valid promo code.");
  await expect(code).toHaveAttribute("aria-invalid", "true");
  await expect(cart.locator(".cart-total")).toContainText("$7.00");
  await code.fill("SAVE10");
  await code.press("Enter");
  await expect(cart.getByRole("alert")).toHaveCount(0);
  await expect(cart.locator(".cart-total")).toContainText("$6.30");
  await cart.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(cart.locator(".cart-total")).toContainText("$6.30");
  await cart.getByRole("button", { name: "Add one Drip Coffee" }).click();
  await expect(cart.locator(".cart-total")).toContainText("$9.45");
  await expect(cart.getByRole("status")).toContainText("−$0.00");
  await cart.getByRole("button", { name: "Remove one Drip Coffee" }).click();
  await expect(cart.locator(".cart-total")).toContainText("$6.30");
  await code.fill("NOT-A-CODE");
  await cart.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(cart.getByRole("alert")).toBeVisible();
  await expect(cart.getByRole("status")).toContainText("SAVE10");
  await expect(cart.locator(".cart-total")).toContainText("$6.30");
  await cart.getByRole("button", { name: "Remove promo code" }).click();
  await expect(code).toHaveValue("");
  await expect(cart.getByRole("alert")).toHaveCount(0);
  await expect(cart.getByRole("status")).toHaveCount(0);
  await expect(cart.locator(".cart-total")).toContainText("$7.00");

  await page.reload();
  await page.waitForLoadState("networkidle");
  cart = await openCart(page);
  await expect(cart.getByLabel("Promo code", { exact: true })).toHaveValue("");
  await expect(cart.locator(".cart-total")).toContainText("$7.00");
});

test("unknown stored promo codes are not restored", async ({ page }) => {
  await openStorefront(page);
  await addToCart(page, "Espresso");
  await page.evaluate(() => {
    localStorage.setItem("bean-and-byte:promo-code", "NOT-A-CODE");
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  const cart = await openCart(page);
  await expect(cart.getByLabel("Promo code", { exact: true })).toHaveValue("");
  await expect(cart.locator(".cart-total")).toContainText("$2.95");
});

test("POST /api/orders validates SAVE10 and ignores supplied discounts", async ({
  request,
}) => {
  const body = {
    name: "Ada",
    pickup: "asap",
    items: [
      { productId: "drip", quantity: 3 },
      { productId: "espresso", quantity: 1 },
    ],
    promoCode: "  save10  ",
    totalCents: 1,
    discountCents: 1239,
  };
  const placed = await request.post("/api/orders", { data: body });
  expect(placed.status()).toBe(201);
  expect(await placed.json()).toMatchObject({
    promoCode: "SAVE10",
    totalCents: 1210,
  });

  for (const promoCode of ["NOT-A-CODE", 10, null, ["SAVE10"]]) {
    const rejected = await request.post("/api/orders", {
      data: { ...body, promoCode },
    });
    expect(rejected.status()).toBe(400);
    expect(await rejected.json()).toEqual({
      errors: ["Enter a valid promo code."],
    });
  }
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
