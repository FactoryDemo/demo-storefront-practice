import type { Metadata } from "next";
import { CartDrawer } from "../components/CartDrawer";
import { CartProvider } from "../components/CartProvider";
import { SiteHeader } from "../components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bean & Byte — Specialty coffee, ordered ahead",
  description:
    "Small-batch coffee and a short menu. Order ahead for pickup. A demo storefront.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <SiteHeader />
          {children}
          <CartDrawer />
          <footer className="site-footer">
            <p>
              Bean &amp; Byte is a demo storefront. Orders are pretend and no
              card is ever charged.
            </p>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
