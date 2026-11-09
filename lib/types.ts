export type ProductCategory = "hot" | "cold" | "beans" | "bakery";

export type Product = {
  id: string;
  name: string;
  priceCents: number;
  category: ProductCategory;
  description: string;
  /** Path of the product photo under public/, e.g. "/products/espresso.jpg". */
  image: string;
};

export type Category = {
  id: ProductCategory;
  name: string;
  description: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type PricedLine = {
  productId: string;
  quantity: number;
  lineTotalCents: number;
};

export type Cart = {
  items: CartItem[];
};
