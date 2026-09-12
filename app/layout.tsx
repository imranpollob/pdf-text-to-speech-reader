import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import NavBar from "../components/NavBar";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0d9488" },
    { media: "(prefers-color-scheme: dark)", color: "#071311" },
  ],
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://imranpollob.github.io/pdf-text-to-speech-reader/"),
  title: "PDF Text to Speech Reader | Free Online PDF & Text Reader",
  description:
    "Free, privacy-friendly online PDF and text reader with natural text-to-speech, interactive synchronized sentence highlighting, smart line tracking, and zoom controls.",
  keywords: [
    "PDF reader",
    "text to speech",
    "TTS",
    "PDF audio reader",
    "speech synthesis",
    "read aloud",
    "PDF Text to Speech Reader",
    "listen to PDF",
    "accessible reader",
  ],
  authors: [{ name: "Imran Pollob", url: "https://github.com/imranpollob" }],
  creator: "Imran Pollob",
  publisher: "Imran Pollob",
  applicationName: "PDF Text to Speech Reader",
  alternates: {
    canonical: "./",
  },
  manifest: "./manifest.webmanifest",
  icons: {
    icon: [
      { url: "./favicon.png", sizes: "32x32", type: "image/png" },
      { url: "./icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "./icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "./favicon.png",
    apple: [{ url: "./apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "https://imranpollob.github.io/pdf-text-to-speech-reader/",
    title: "PDF Text to Speech Reader — Free Online PDF & Text Reader",
    description:
      "Listen to PDFs and plain text with synchronized real-time sentence highlighting, smart line tracking, customizable voices, and speed controls.",
    siteName: "PDF Text to Speech Reader",
    images: [
      {
        url: "./og-image.png",
        width: 1200,
        height: 630,
        alt: "PDF Text to Speech Reader",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Text to Speech Reader — Free Online PDF & Text Reader",
    description:
      "Listen to PDFs and plain text with synchronized real-time sentence highlighting, smart line tracking, customizable voices, and speed controls.",
    images: ["./og-image.png"],
    creator: "@imranpollob",
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "PDF Text to Speech Reader",
  url: "https://imranpollob.github.io/pdf-text-to-speech-reader/",
  description:
    "An intelligent PDF & text reader with interactive text-to-speech, real-time sentence highlighting, and smart line tracking.",
  image: "https://imranpollob.github.io/pdf-text-to-speech-reader/og-image.png",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  author: {
    "@type": "Person",
    name: "Imran Pollob",
    url: "https://github.com/imranpollob",
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "PDF Document text-to-speech",
    "Plain text reader",
    "Real-time sentence highlighting",
    "Automatic line tracking",
    "Customizable speech rate",
    "Browser and Neural Kokoro TTS support",
    "Full offline privacy",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth text-[16px] overflow-x-hidden max-w-full">
      <body
        suppressHydrationWarning
        className={`${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased overflow-x-hidden max-w-full min-h-screen pt-[72px] max-md:pt-[68px] leading-[1.6] bg-background text-foreground font-sans transition-colors duration-[250ms] ease-linear`}
      >
        <Script
          id="json-ld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = saved || (prefersDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
