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
    "Free, open-source PDF and text reader with synchronized sentence highlighting. Listen to PDFs and pasted text in your browser with neural and system voices.",
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
    "synchronized sentence highlighting",
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
      "Listen to PDFs and pasted text with synchronized sentence highlighting, adjustable speed, and neural or system voices.",
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
      "Listen to PDFs and pasted text with synchronized sentence highlighting, adjustable speed, and neural or system voices.",
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
        "Free, privacy-friendly PDF and text reader with synchronized sentence highlighting and neural voices.",
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
          name: "Is it free and private?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The application is free and open-source. Processing happens in your browser with no account or registration required.",
          },
        },
        {
          "@type": "Question",
          name: "Are my PDFs uploaded to a server?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. PDFs and pasted text are parsed and rendered directly in your browser. Your documents are never uploaded to our servers.",
          },
        },
        {
          "@type": "Question",
          name: "What types of PDFs are supported?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Any standard digital PDF containing readable text is supported (such as research papers, textbooks, and reports). Scanned image-only PDFs without an embedded text layer are not currently supported unless OCR has already been applied.",
          },
        },
        {
          "@type": "Question",
          name: "Can I paste text instead of uploading a PDF?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can paste or type text directly into the reader and listen with the same synchronized sentence highlighting and audio controls.",
          },
        },
        {
          "@type": "Question",
          name: "How does synchronized highlighting work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "As audio plays, the current sentence is highlighted and scrolled into view. You can also select any sentence to jump playback directly to that point.",
          },
        },
        {
          "@type": "Question",
          name: "What voices are available?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can use voices provided by your browser and operating system, or connect to the optional local Kokoro engine for 50+ neural voices running directly on your device.",
          },
        },
        {
          "@type": "Question",
          name: "Does it work on phones and tablets?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The interface is optimized for mobile screens with touch-friendly controls, auto-fit PDF page scaling, and a bottom playback bar.",
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
