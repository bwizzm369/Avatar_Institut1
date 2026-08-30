import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import {
  Cairo,
  Cormorant_Garamond,
  Inter,
  Playfair_Display,
} from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PlatformNotice } from "@/components/PlatformNotice";
import { Providers } from "@/components/Providers";
import { isAdminPath } from "@/lib/admin/guards";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Avatar Institut",
    template: "%s · Avatar Institut",
  },
  description:
    "Avatar Institut — bilingual e-learning platform for metaphysics, consciousness, and human development.",
};

export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#FBFAF7",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const adminShell = isAdminPath(pathname);

  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${playfair.variable} ${cormorant.variable} ${cairo.variable}`}
    >
      <body>
        <Providers>
          {adminShell ? (
            children
          ) : (
            <div className="app-shell">
              <PlatformNotice />
              <Header />
              <main className="main-content">{children}</main>
              <Footer />
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
