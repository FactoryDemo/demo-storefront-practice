import type { Metadata } from "next";
import { OrderConfirmation } from "../../../components/OrderConfirmation";

export const metadata: Metadata = {
  title: "Your order · Bean & Byte",
};

export default function OrderPage({ params }: { params: { id: string } }) {
  return (
    <main className="page">
      <OrderConfirmation orderId={params.id} />
    </main>
  );
}
