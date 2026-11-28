import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteConfig } from "@/config/site";
import { AppProviders } from "@/providers/AppProviders";

// Self-hosted (variable, latin subset) so production builds never depend on
// fonts.googleapis.com.
const plusJakartaSans = localFont({
  src: "../assets/fonts/PlusJakartaSans.woff2",
  variable: "--font-plus-jakarta-sans",
  weight: "400 800",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name} — Medicine Portal`, template: `%s | ${siteConfig.shortName}` },
  description: siteConfig.description,
  keywords: ["medicine", "pharmacy", "healthcare", "India", "medicine store", "medicine representative"],
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image", title: siteConfig.name, description: siteConfig.description },
  // A signed-in console — keep it out of search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#060D1C" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plusJakartaSans.variable} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="light" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
