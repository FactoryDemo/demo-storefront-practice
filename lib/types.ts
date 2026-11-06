export type Product = {
  id: string;
  name: string;
  priceCents: number;
  emoji: string;
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
