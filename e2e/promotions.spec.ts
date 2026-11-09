import { expect, test, type Page } from "@playwright/test";

async function openPromoCart(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const drip = page.locator(".product-card").filter({
    has: page.getByText("Drip Coffee", { exact: true }),
  });
  const espresso = page.locator(".product-card").filter({
    has: page.getByText("Espresso", { exact: true }),
  });
  for (let quantity = 0; quantity < 3; quantity += 1) {
    await drip.getByRole("button", { name: "Add to cart" }).click();
  }
  await espresso.getByRole("button", { name: "Add to cart" }).click();
  await page.getByRole("button", { name: "Cart, 4 items" }).click();
  return page.getByRole("dialog", { name: "Your cart" });
}

test("SAVE10 survives reload and checkout, then clears for the next order", async ({
  page,
}) => {
  let cart = await openPromoCart(page);
  await cart.getByLabel("Promo code", { exact: true }).fill("  save10  ");
  await cart.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(cart.getByRole("status")).toHaveText(
    "SAVE10 applied: 10% off non-bulk items."
  );
  await expect(cart.locator(".cart-total")).toContainText("$12.10");
  await expect(cart.locator(".cart-line").first()).toContainText("$9.45");

  // Applying twice must not compound the order discount.
  await cart.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(cart.locator(".cart-total")).toContainText("$12.10");
  await cart.getByRole("button", { name: "Remove one Drip Coffee" }).click();
  await expect(cart.locator(".cart-total")).toContainText("$8.95");
  await cart.getByRole("button", { name: "Add one Drip Coffee" }).click();
  await expect(cart.locator(".cart-total")).toContainText("$12.10");

  await page.reload();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Cart, 4 items" }).click();
  cart = page.getByRole("dialog", { name: "Your cart" });
  await expect(cart.getByLabel("Promo code", { exact: true })).toHaveValue(
    "SAVE10"
  );
  await expect(cart.locator(".cart-total")).toContainText("$12.10");
  await cart.getByRole("link", { name: "Checkout" }).click();
  await expect(page.locator(".checkout-summary")).toContainText(
    "SAVE10 · 10% off non-bulk items"
  );
  await expect(page.locator(".order-total")).toContainText("$12.10");

  // A direct checkout reload must restore both items and the applied code.
  await page.reload();
  await page.getByLabel("Name for the order").fill("Ada");
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/orders") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Place order · $12.10" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(201);
  expect(response.request().postDataJSON().promoCode).toBe("SAVE10");
  expect(await response.json()).toMatchObject({
    promoCode: "SAVE10",
    totalCents: 1210,
  });
  await expect(page).toHaveURL(/\/orders\/BB-[0-9A-F]{6}$/);
  await expect(page.locator(".order-lines")).toContainText(
    "SAVE10 · 10% off non-bulk items"
  );
  await expect(page.locator(".order-total")).toContainText("$12.10");
  await expect(
    page.getByRole("button", { name: "Cart, 0 items" })
  ).toBeVisible();

  await page.getByRole("link", { name: "Start a new order" }).click();
  cart = await openPromoCart(page);
  await expect(cart.getByLabel("Promo code", { exact: true })).toHaveValue("");
  await expect(cart.locator(".cart-total")).toContainText("$12.40");
});

test("invalid codes leave totals unchanged and removing SAVE10 restores the total on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const cart = await openPromoCart(page);
  const input = cart.getByLabel("Promo code", { exact: true });
  const apply = cart.getByRole("button", { name: "Apply", exact: true });
  await input.fill("SAVE100");
  await apply.click();
  await expect(cart.getByRole("alert")).toHaveText(
    "This promo code is not valid."
  );
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(cart.locator(".cart-total")).toContainText("$12.40");

  await input.fill("SAVE10");
  await input.press("Enter");
  await expect(cart.getByRole("alert")).toHaveCount(0);
  await expect(cart.locator(".cart-total")).toContainText("$12.10");
  await input.fill("invalid");
  await apply.click();
  await expect(cart.getByRole("alert")).toBeVisible();
  await expect(cart.getByRole("status")).toContainText("SAVE10 applied");
  await expect(cart.locator(".cart-total")).toContainText("$12.10");
  await cart.getByRole("button", { name: "Remove promo code" }).click();
  await expect(input).toHaveValue("");
  await expect(cart.getByRole("status")).toHaveCount(0);
  await expect(cart.getByRole("alert")).toHaveCount(0);
  await expect(cart.locator(".cart-total")).toContainText("$12.40");

  await page.reload();
  await page.getByRole("button", { name: "Cart, 4 items" }).click();
  await expect(
    page.getByRole("dialog").getByLabel("Promo code", { exact: true })
  ).toHaveValue("");
});

test("the order API validates SAVE10 and ignores forged client prices", async ({
  request,
}) => {
  const order = {
    name: "Ada",
    pickup: "asap",
    items: [
      { productId: "drip", quantity: 3 },
      { productId: "espresso", quantity: 1 },
    ],
  };
  const placed = await request.post("/api/orders", {
    data: {
      ...order,
      promoCode: " save10 ",
      totalCents: 1,
      discountCents: 1239,
    },
  });
  expect(placed.status()).toBe(201);
  expect(await placed.json()).toMatchObject({
    promoCode: "SAVE10",
    totalCents: 1210,
  });
  for (const promoCode of ["SAVE100", 10, null, ["SAVE10"]]) {
    const rejected = await request.post("/api/orders", {
      data: { ...order, promoCode },
    });
    expect(rejected.status()).toBe(400);
    expect((await rejected.json()).errors).toHaveLength(1);
  }
});
