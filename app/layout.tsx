import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "./components/gadget/nav";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Footer from "./components/gadget/footer";
import { ThemeProvider } from "./components/gadget/theme-switch";
import { AuthProvider } from "./contexts/auth";
import { NostrProvider } from "./contexts/nostr";
import { NotificationProvider } from "./contexts/notification";
import { NotificationContainer } from "./components/gadget/notification";
import { metaData } from "./lib/config";
import { CCCProvider } from "./contexts/ccc";
import { Web5DIDProvider } from "./contexts/web5-did";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(metaData.baseUrl),
  title: {
    default: metaData.title,
    template: `%s | ${metaData.title}`,
  },
  description: metaData.description,
  openGraph: {
    images: metaData.ogImage,
    title: metaData.title,
    description: metaData.description,
    url: metaData.baseUrl,
    siteName: metaData.name,
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  twitter: {
    title: metaData.name,
    card: "summary_large_image",
  },
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.className}`}>
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          href="/rss.xml"
          title="RSS Feed"
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          href="/atom.xml"
          title="Atom Feed"
        />
        <link
          rel="alternate"
          type="application/feed+json"
          href="/feed.json"
          title="JSON Feed"
        />
      </head>
      <body className="antialiased flex flex-col items-center justify-center mx-auto mt-2 lg:mt-8 mb-12">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NotificationProvider>
            <NostrProvider>
              <AuthProvider>
                <CCCProvider>
                  <Web5DIDProvider>
                    <main className="flex-auto min-w-0 mt-2 md:mt-6 flex flex-col px-6 sm:px-4 md:px-0 max-w-[624px] w-full">
                      <Navbar />
                      {children}
                      <Footer />
                      <Analytics />
                      <SpeedInsights />
                    </main>
                    <NotificationContainer />
                  </Web5DIDProvider>
                </CCCProvider>
              </AuthProvider>
            </NostrProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
