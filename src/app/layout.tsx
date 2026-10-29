import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IT:DA",
  description: "의료기관 검사 의뢰·예약 플랫폼",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
