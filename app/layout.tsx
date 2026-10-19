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
  title: "ReadAloud – Free PDF & Text to Speech Reader",
  description:
    "ReadAloud is a free PDF & text to speech reader. Listen to PDF, DOCX, TXT and Markdown files or pasted text with synchronized sentence highlighting, voice selection and adjustable playback speed — processed locally in your browser.",
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
    title: "ReadAloud – Free PDF & Text to Speech Reader",
    description:
      "Listen to PDF, DOCX, TXT and Markdown files or pasted text with synchronized sentence highlighting, voice selection and adjustable playback speed.",
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
    title: "ReadAloud – Free PDF & Text to Speech Reader",
    description:
      "Listen to PDF, DOCX, TXT and Markdown files or pasted text with synchronized sentence highlighting, voice selection and adjustable playback speed.",
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
            text: "ReadAloud is free and open-source, with no account required. Document files are parsed in your browser.",
          },
        },
        {
          "@type": "Question",
          name: "Are my documents uploaded?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Document files are parsed in your browser and are not uploaded by ReadAloud. If you enable the optional Kokoro voices, sentences are sent to the Kokoro server URL you configure to generate audio.",
          },
        },
        {
          "@type": "Question",
          name: "Which formats are supported?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "PDF, DOCX, TXT and Markdown files with selectable text are supported. Scanned image-only PDFs need OCR first, because they have no text layer to read.",
          },
        },
        {
          "@type": "Question",
          name: "Can I paste text instead of uploading?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Paste or type text to listen with the same synchronized highlighting and playback controls.",
          },
        },
        {
          "@type": "Question",
          name: "How does synchronized highlighting work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The sentence being spoken is highlighted as you listen. Select any sentence to start playback from there.",
          },
        },
        {
          "@type": "Question",
          name: "Which voices can I use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Use voices from your browser and operating system, or connect an optional Kokoro server you run for additional neural voices.",
          },
        },
        {
          "@type": "Question",
          name: "Does ReadAloud work on phones and tablets?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Controls are touch-friendly, PDF pages fit your screen, and playback stays in a bottom bar.",
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
