import type { Metadata } from "next";
import { Checkout } from "../../components/Checkout";

export const metadata: Metadata = {
  title: "Checkout · Bean & Byte",
};

export default function CheckoutPage() {
  return (
    <main className="page">
      <h1 className="page-title">Checkout</h1>
      <Checkout />
    </main>
  );
}
