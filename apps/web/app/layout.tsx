import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "PULSE — Attention Intelligence",
  description: "Deterministic attention intelligence for Monad agents.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
