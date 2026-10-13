import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Sideby — a little closer",
  description: "A thoughtful place for everyday conversations.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
