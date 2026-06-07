import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SufiSoul | Roman Urdu Shayari & Community",
  description: "Express yourself in Roman Urdu. Generate poetry matching your mood, publish anonymously, and collaborate with other creators.",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}

