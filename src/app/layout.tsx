
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SecretWish | Every Surprise Has a Story",
    template: "%s | SecretWish",
  },
  description:
    "Create magical birthday surprises with private messages, secret questions, photos and unforgettable moments.",
  applicationName: "SecretWish",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
