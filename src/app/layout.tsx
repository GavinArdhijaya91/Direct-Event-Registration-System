import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://natal-pwk-unnes-2026.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Natal PWK UNNES 2026 - Pendaftaran",
  description: "Natal PWK UNNES 2026 dengan tema Terang Natal menuntun Civitas Akademika di tengah kegelapan. Daftar sekarang untuk mendapatkan tiket Anda.",
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
  openGraph: {
    title: "Natal PWK UNNES 2026 - Pendaftaran & Tiket",
    description: "Natal PWK UNNES 2026 dengan tema Terang Natal menuntun Civitas Akademika di tengah kegelapan. Daftar sekarang untuk mendapatkan tiket resmi.",
    siteName: "Natal PWK UNNES 2026",
    images: [
      {
        url: "/images/logos/logo-natal-pwk-2026.png",
        width: 512,
        height: 512,
        alt: "Logo Natal PWK UNNES 2026",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Natal PWK UNNES 2026",
    description: "Natal PWK UNNES 2026: Terang Natal menuntun Civitas Akademika di tengah kegelapan. Daftar sekarang untuk mendapatkan tiket resmi.",
    images: ["/images/logos/logo-natal-pwk-2026.png"],
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
