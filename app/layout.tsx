import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WS Metrics Dashboard",
  description: "Requests & latency dashboard for OPS_WS2 metrics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
