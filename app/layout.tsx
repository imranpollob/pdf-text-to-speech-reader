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
  title: "PDF & Text to Speech Reader | Free Online Audio Reader",
  description:
    "Free, 100% private online PDF and text-to-speech reader. Upload PDF documents or paste plain text to listen with natural neural voices, synchronized interactive sentence highlighting, and adjustable speed.",
  keywords: [
    "PDF text to speech",
    "paste text to speech",
    "text to speech online",
    "read PDF aloud free",
    "listen to plain text",
    "PDF audio reader",
    "free TTS reader",
    "neural speech synthesis",
    "kokoro TTS",
    "accessible document reader",
    "interactive sentence highlighting",
    "read aloud online",
    "speech reader",
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
    title: "PDF & Text to Speech Reader — Free Online Audio Document Reader",
    description:
      "Upload PDF documents or paste plain text to listen with synchronized real-time sentence highlighting, smart line tracking, customizable voices, and speed controls.",
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
    title: "PDF & Text to Speech Reader — Free Online Audio Document Reader",
    description:
      "Upload PDF documents or paste plain text to listen with synchronized real-time sentence highlighting, smart line tracking, customizable voices, and speed controls.",
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
      name: "PDF Text to Speech Reader",
      url: "https://imranpollob.github.io/pdf-text-to-speech-reader/",
      description:
        "Free, privacy-friendly online PDF and text-to-speech reader with natural neural voices and interactive sentence highlighting.",
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
        "Plain text reader and speech synthesizer",
        "Real-time synchronized sentence highlighting",
        "Automatic line tracking and follow audio",
        "Customizable speech rate from 0.75x to 2.0x",
        "50+ Neural Kokoro TTS and browser voices",
        "100% offline client-side privacy",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is PDF Text to Speech Reader free to use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, PDF Text to Speech Reader is completely free and open-source with no subscription, paywall, or sign-up required.",
          },
        },
        {
          "@type": "Question",
          name: "Are my PDF files and pasted text private?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, 100%. All PDF rendering and text parsing happen directly inside your browser on your device. Your documents are never uploaded to any cloud server.",
          },
        },
        {
          "@type": "Question",
          name: "Can I paste plain text directly instead of uploading a PDF?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can paste any text, article, notes, or speech into the text reader box and immediately listen aloud with interactive sentence tracking.",
          },
        },
        {
          "@type": "Question",
          name: "Does it work on mobile phones and tablets?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The application is fully responsive with an ergonomic thumb-friendly bottom media player, slide-up voice sheets, and auto-fit PDF scaling.",
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
      <body
        suppressHydrationWarning
        className={`${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} antialiased overflow-x-hidden max-w-full min-h-screen pt-16 pb-28 md:pb-32 leading-[1.6] bg-background text-foreground font-sans transition-colors duration-[250ms] ease-linear`}
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
