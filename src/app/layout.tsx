import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Natal PWK UNNES 2026 - Pendaftaran",
  description: "Rayakan Natal PWK UNNES 2026 bersama kami. Perayaan iman, kebersamaan, dan kegembiraan. Daftar sekarang untuk mendapatkan tiket Anda.",
  referrer: "no-referrer",
  icons: {
    icon: [
      { url: "/images/logos/logo-natal-pwk-2026.png", type: "image/png" },
    ],
    shortcut: ["/images/logos/logo-natal-pwk-2026.png"],
    apple: [
      { url: "/images/logos/logo-natal-pwk-2026.png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#064e3b",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.className} ${poppins.variable}`}>
        {children}
      </body>
    </html>
  );
}
