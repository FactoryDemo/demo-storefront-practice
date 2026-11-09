import type { Category, Product, ProductCategory } from "./types";

export const CATEGORIES: Category[] = [
  {
    id: "hot",
    name: "Hot coffee",
    description: "Pulled to order from our house blend.",
  },
  {
    id: "cold",
    name: "Cold",
    description: "Steeped overnight or poured over clear ice.",
  },
  {
    id: "beans",
    name: "Beans",
    description: "Roasted weekly. Whole bean, 250g bags.",
  },
  {
    id: "bakery",
    name: "Bakery",
    description: "Baked in-house every morning.",
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "espresso",
    name: "Espresso",
    priceCents: 295,
    category: "hot",
    description:
      "A double shot of the house blend. Cocoa, cherry, long finish.",
    image: "/products/espresso.jpg",
  },
  {
    id: "drip",
    name: "Drip Coffee",
    priceCents: 350,
    category: "hot",
    description: "Batch-brewed single origin, rotated weekly.",
    image: "/products/drip.jpg",
  },
  {
    id: "latte",
    name: "Latte",
    priceCents: 475,
    category: "hot",
    description: "Double espresso and steamed whole milk.",
    image: "/products/latte.jpg",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    priceCents: 450,
    category: "hot",
    description: "Espresso, milk, and a thick cap of foam.",
    image: "/products/cappuccino.jpg",
  },
  {
    id: "cold-brew",
    name: "Cold Brew",
    priceCents: 425,
    category: "cold",
    description: "Steeped for 18 hours. Smooth and chocolatey.",
    image: "/products/cold-brew.jpg",
  },
  {
    id: "iced-latte",
    name: "Iced Latte",
    priceCents: 495,
    category: "cold",
    description: "Double espresso over ice with cold milk.",
    image: "/products/iced-latte.jpg",
  },
  {
    id: "espresso-tonic",
    name: "Espresso Tonic",
    priceCents: 525,
    category: "cold",
    description: "Espresso over tonic and ice, with an orange twist.",
    image: "/products/espresso-tonic.jpg",
  },
  {
    id: "beans",
    name: "House Blend, 250g",
    priceCents: 1500,
    category: "beans",
    description: "Brazil and Colombia. Chocolate, hazelnut, caramel.",
    image: "/products/beans.jpg",
  },
  {
    id: "ethiopia",
    name: "Ethiopia Guji, 250g",
    priceCents: 1800,
    category: "beans",
    description: "Light roast. Jasmine, bergamot, stone fruit.",
    image: "/products/ethiopia.jpg",
  },
  {
    id: "decaf",
    name: "Swiss Water Decaf, 250g",
    priceCents: 1600,
    category: "beans",
    description: "Decaffeinated with water only. Brown sugar, almond.",
    image: "/products/decaf.jpg",
  },
  {
    id: "croissant",
    name: "Butter Croissant",
    priceCents: 375,
    category: "bakery",
    description: "Laminated with cultured butter.",
    image: "/products/croissant.jpg",
  },
  {
    id: "banana-bread",
    name: "Banana Bread",
    priceCents: 395,
    category: "bakery",
    description: "Brown butter, walnuts, a pinch of sea salt.",
    image: "/products/banana-bread.jpg",
  },
  {
    id: "cardamom-bun",
    name: "Cardamom Bun",
    priceCents: 425,
    category: "bakery",
    description: "Swedish-style knot with pearl sugar.",
    image: "/products/cardamom-bun.jpg",
  },
];

export function getProduct(id: string): Product {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) {
    throw new Error(`Unknown product id: ${id}`);
  }
  return product;
}

export function productsInCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter((product) => product.category === category);
}
