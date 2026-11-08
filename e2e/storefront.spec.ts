import { expect, test, type Locator, type Page } from "@playwright/test";

const ADD_TO_CART = { name: "Add to cart", exact: true };

/** The smallest element holding a product's name and its Add to cart button. */
function productCard(page: Page, productName: string): Locator {
  return page
    .locator("div")
    .filter({ has: page.getByText(productName, { exact: true }) })
    .filter({ has: page.getByRole("button", ADD_TO_CART) })
    .last();
}

/** The cart line for a product, found through its quantity controls. */
function cartLine(page: Page, productName: string): Locator {
  return page
    .locator("div")
    .filter({
      has: page.getByRole("button", {
        name: `Remove one ${productName}`,
        exact: true,
      }),
    })
    .last();
}

test("home page loads and shows the catalog", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Bean & Byte/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Bean & Byte/ })
  ).toBeVisible();
  for (const name of ["Espresso", "Drip Coffee", "Latte", "Cold Brew"]) {
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }
  await expect(productCard(page, "Drip Coffee")).toContainText("$3.50");
  await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
});

test("three of the same item get 10% off that cart line", async ({ page }) => {
  await page.goto("/");

  const addDrip = productCard(page, "Drip Coffee").getByRole(
    "button",
    ADD_TO_CART
  );
  await addDrip.click();
  await expect(cartLine(page, "Drip Coffee")).toContainText("$3.50");
  await addDrip.click();
  await expect(cartLine(page, "Drip Coffee")).toContainText("$7.00");
  await addDrip.click();

  // 3 × $3.50 = $10.50 gross, less 10% = $9.45.
  const line = cartLine(page, "Drip Coffee");
  await expect(line).toContainText(/\$\d+\.\d{2}/);
  await expect(line).toContainText("$9.45");
  await expect(line).not.toContainText("$10.50");
});

test("health endpoint reports ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});
