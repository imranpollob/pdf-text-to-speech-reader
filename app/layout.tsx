import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Header from "../components/Header";
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
  title: "ReadAloud: PDF & Text to Speech with Synchronized Highlighting",
  description:
    "ReadAloud is a free PDF & text to speech reader for PDF, DOCX, TXT and Markdown files or pasted text, with synchronized sentence highlighting. Files are parsed locally in your browser.",
  keywords: [
    "PDF text to speech",
    "paste text to speech",
    "text to speech online",
    "read PDF aloud free",
    "listen to plain text",
    "Markdown text to speech",
    "DOCX text to speech",
    "PDF audio reader",
    "free TTS reader",
    "neural speech synthesis",
    "kokoro TTS",
    "accessible document reader",
    "synchronized sentence highlighting",
    "read aloud online",
    "speech reader",
  ],
  authors: [{ name: "Imran Pollob", url: "https://github.com/imranpollob" }],
  creator: "Imran Pollob",
  publisher: "Imran Pollob",
  applicationName: "ReadAloud",
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
    title: "ReadAloud: PDF & Text to Speech with Synchronized Highlighting",
    description:
      "ReadAloud reads PDF, DOCX, TXT and Markdown files or pasted text aloud with synchronized sentence highlighting. Free, no account, in your browser.",
    siteName: "ReadAloud",
    images: [
      {
        url: "./og-image.png",
        width: 1200,
        height: 630,
        alt: "ReadAloud – PDF & text to speech reader",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReadAloud: PDF & Text to Speech with Synchronized Highlighting",
    description:
      "ReadAloud reads PDF, DOCX, TXT and Markdown files or pasted text aloud with synchronized sentence highlighting. Free, no account, in your browser.",
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
  "@graph": [
    {
      "@type": "WebApplication",
      name: "ReadAloud",
      url: "https://imranpollob.github.io/pdf-text-to-speech-reader/",
      description:
        "Free reader for PDF, DOCX, TXT and Markdown files and pasted text, with synchronized sentence highlighting and browser or optional local Kokoro voices. Document files are parsed in the browser.",
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
        "PDF and plain text reading",
        "Synchronized sentence highlighting",
        "Select any sentence to jump playback",
        "Auto-scroll to follow along automatically",
        "Adjustable playback speed from 0.75× to 2×",
        "50+ Kokoro neural voices and system voices",
        "Local in-browser document processing",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is ReadAloud free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. ReadAloud is free and open-source, with no account required.",
          },
        },
        {
          "@type": "Question",
          name: "Are my documents uploaded?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Files are parsed locally in your browser. The optional Kokoro voices only contact the voice-server address you enter in the app.",
          },
        },
        {
          "@type": "Question",
          name: "Which formats are supported?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PDF, DOCX, TXT and Markdown files with readable text, plus pasted text. Scanned image-only PDFs need OCR first.",
          },
        },
        {
          "@type": "Question",
          name: "Which voices can I use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Voices from your browser and system, plus optional high-quality Kokoro voices. Speeds run from 0.75x to 2x, on phones and tablets too.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth text-[16px] overflow-x-hidden max-w-full">
      {/* Brand tools launcher (live from personal-brand-theme; tools.json updates apply automatically) */}
      <link rel="stylesheet" href="https://imranpollob.github.io/personal-brand-theme/launcher.css" precedence="default" />
      <body
        suppressHydrationWarning
        className={`${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased overflow-x-hidden max-w-full min-h-screen pt-16 leading-[1.6] bg-background text-foreground font-sans transition-colors duration-[250ms] ease-linear`}
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
        <Header />
        {children}
      </body>
    </html>
  );
}
