import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Know Your Risk",
  description:
    "A side-by-side comparison of yield & collateral backing between select Morpho Vaults & Aave V3.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
