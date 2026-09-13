'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AudioEngine } from '../components/AudioEngine';
import { TextViewer } from '../components/TextViewer';
import { PlayerBar } from '../components/PlayerBar';
import { PageNavigator } from '../components/PageNavigator';
import { useAudioStore } from '../store/use-audio-store';
import { normalizeRawText } from '../lib/text-normalizer';
import { cn } from '../lib/cn';
import {
  UploadCloudIcon,
  FileTextIcon,
  SparklesIcon,
  EditIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BookOpenIcon,
  GitHubIcon,
  ShieldIcon,
  AutoScrollIcon,
  VoiceIcon,
  SmartphoneIcon,
} from '../components/Icons';

const PdfViewer = dynamic(
  () => import('../components/PdfViewer').then((mod) => mod.PdfViewer),
  { ssr: false }
);

export default function Home() {
  const file = useAudioStore((state) => state.file);
  const setFile = useAudioStore((state) => state.setFile);
  const setDocumentTitle = useAudioStore((state) => state.setDocumentTitle);
  const loadSegments = useAudioStore((state) => state.loadSegments);
  const segments = useAudioStore((state) => state.segments);
  const playbackSpeed = useAudioStore((state) => state.playbackSpeed);

  const [pdfMaxWidth, setPdfMaxWidth] = useState<number>(1080);

  const TEXT_CACHE_KEY = 'pdf-text-to-speech-reader-text-input';
  const [textInput, setTextInput] = useState('');
  const [textLoaded, setTextLoaded] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Restore cached text
  useEffect(() => {
    const cached = localStorage.getItem(TEXT_CACHE_KEY);
    if (cached) setTextInput(cached);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setTextLoaded(false);
    }
  };

  const handleLoadSamplePdf = async () => {
    try {
      setIsLoadingSample(true);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/hello.pdf`);
      if (!response.ok) throw new Error('Sample PDF not found');
      const blob = await response.blob();
      const sampleFile = new File([blob], 'Secure-BSM-Research-Paper.pdf', {
        type: 'application/pdf',
      });
      setFile(sampleFile);
      setTextLoaded(false);
    } catch (e) {
      console.error('Error loading sample PDF:', e);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleLoadSampleText = () => {
    const sample = `Paste any text here and open it in the reader. As the audio plays, the current sentence will be highlighted automatically. You can also select any sentence to start listening from that point.`;
    setTextInput(sample);
    try {
      localStorage.setItem(TEXT_CACHE_KEY, sample);
    } catch { }
  };

  const handleTextLoad = () => {
    if (!textInput.trim()) return;
    const segs = normalizeRawText(textInput);
    setDocumentTitle('Pasted Text Document');
    loadSegments(segs);
    setTextLoaded(true);
    setFile(null); // Clear PDF if any
  };

  const handleTextEdit = () => {
    setTextLoaded(false);
    loadSegments([]);
  };

  const handleTextClear = () => {
    setTextInput('');
    try {
      localStorage.removeItem(TEXT_CACHE_KEY);
    } catch { }
  };

  // Reset to empty state when file and segments are cleared
  useEffect(() => {
    if (!file && segments.length === 0) {
      setTextLoaded(false);
    }
  }, [file, segments]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDropAreaClick = () => {
    fileInputRef.current?.click();
  };

  // Desktop PDF viewer resizer logic
  useEffect(() => {
    let startX = 0;
    let startWidth = 0;
    let resizing = false;

    const onPointerMove = (e: PointerEvent) => {
      if (!resizing) return;
      const dx = e.clientX - startX;
      const next = Math.max(520, Math.min(1600, startWidth + dx));
      setPdfMaxWidth(next);
    };

    const onPointerUp = () => {
      resizing = false;
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    const el = document.querySelector('.the-pdf-viewer .resizer');
    if (!el) return;

    const onPointerDown = (ev: PointerEvent) => {
      resizing = true;
      startX = ev.clientX;
      startWidth =
        (document.querySelector('.the-pdf-viewer') as HTMLElement)?.clientWidth ||
        pdfMaxWidth;
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    };

    el.addEventListener('pointerdown', onPointerDown as EventListener);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown as EventListener);
    };
  }, [pdfMaxWidth]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === 'application/pdf' ||
        droppedFile.name.endsWith('.pdf')
      ) {
        setFile(droppedFile);
        setTextLoaded(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const showEmptyState = !file && !textLoaded;

  // Text statistics
  const wordCount = textInput.trim() ? textInput.trim().split(/\s+/).length : 0;
  const charCount = textInput.length;
  const estimatedReadMinutes = Math.max(
    1,
    Math.ceil(wordCount / (150 * playbackSpeed))
  );

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: 'Is it free and private?',
      a: 'Yes. The application is free and open-source. Processing happens in your browser with no account or registration required.',
    },
    {
      q: 'Are my PDFs uploaded to a server?',
      a: 'No. PDFs and pasted text are parsed and rendered directly in your browser. Your documents are never uploaded to our servers.',
    },
    {
      q: 'What types of PDFs are supported?',
      a: 'Any standard digital PDF containing readable text is supported (such as research papers, textbooks, and reports). Scanned image-only PDFs without an embedded text layer are not currently supported unless OCR has already been applied.',
    },
    {
      q: 'Can I paste text instead of uploading a PDF?',
      a: 'Yes. You can paste or type text directly into the reader and listen with the same synchronized sentence highlighting and audio controls.',
    },
    {
      q: 'How does synchronized highlighting work?',
      a: 'As audio plays, the current sentence is highlighted and scrolled into view. You can also select any sentence to jump playback directly to that point.',
    },
    {
      q: 'What voices are available?',
      a: 'You can use voices provided by your browser and operating system, or connect to the optional local Kokoro engine for 50+ neural voices running directly on your device.',
    },
    {
      q: 'Does it work on phones and tablets?',
      a: 'Yes. The interface is optimized for mobile screens with touch-friendly controls, auto-fit PDF page scaling, and a bottom playback bar.',
    },
  ];

  return (
    <main className="w-full flex flex-col items-center min-h-[calc(100vh-64px)] px-4 sm:px-6">
      <div
        className={cn(
          'the-pdf-viewer relative w-full flex flex-col items-center',
          showEmptyState && 'max-w-6xl pt-4 sm:pt-6 pb-0'
        )}
        style={{ maxWidth: !showEmptyState ? `${pdfMaxWidth}px` : undefined }}
      >
        {showEmptyState ? (
          <div className="w-full flex flex-col gap-10 sm:gap-14 animate-fade-in-slow">
            {/* Hero Section */}
            <section
              className="text-center flex flex-col items-center pt-4 max-w-3xl mx-auto"
              aria-label="PDF Text to Speech Reader Overview"
            >
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-5xl leading-[1.15] font-extrabold text-foreground tracking-tight">
                Listen to <span className="text-primary">PDFs &amp; Text</span> with Synchronized Highlighting
              </h1>

              <p className="mt-4 text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
                Turn PDFs and pasted text into speech. Follow along with synchronized sentence highlighting,
                jump to any sentence, and adjust the voice and playback speed.
              </p>
            </section>

            {/* DUAL INPUT SECTION: Upload PDF & Paste Text with Equal Prominence */}
            <section
              aria-label="Upload document or paste text"
              className="w-full"
            >
              <div className="text-center mb-6">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  Choose How You Want to Read
                </h2>
                <p className="text-sm text-muted mt-1">
                  Upload a PDF or paste text to start listening.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Feature 1: Upload PDF File */}
                <div
                  className={cn(
                    'bg-surface border border-border rounded-2xl md:rounded-3xl p-6 sm:p-8 flex flex-col shadow-sm transition-all duration-200 hover:border-primary hover:shadow-md',
                    dragActive && 'border-primary bg-primary-subtle/30 ring-4 ring-primary/20'
                  )}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center shrink-0 shadow-xs">
                      <UploadCloudIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-foreground leading-tight">
                        Upload PDF
                      </h3>
                      <span className="text-xs text-muted">Research papers, books, essays, and reports</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted mb-6 leading-relaxed">
                    Drag and drop a PDF here, or choose a file from your device. The document is processed
                    for reading and synchronized sentence playback.
                  </p>

                  <div
                    onClick={handleDropAreaClick}
                    className="mt-auto border-2 border-dashed border-border/80 hover:border-primary bg-background/50 hover:bg-background rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group mb-4"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDropAreaClick();
                      }
                    }}
                  >
                    <UploadCloudIcon size={32} className="text-primary mb-2 transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      Choose a PDF
                    </span>
                    <span className="text-xs text-muted mt-0.5">or drag and drop it here</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-between pt-2 border-t border-border/60">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-navbar-control border border-navbar-control-border text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        onClick={handleLoadSamplePdf}
                        disabled={isLoadingSample}
                      >
                        <SparklesIcon size={13} className="text-primary" />
                        <span>{isLoadingSample ? 'Loading PDF…' : 'Sample PDF'}</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-md hover:bg-primary-hover hover:scale-102 active:scale-98 transition-all cursor-pointer border-0"
                      onClick={handleDropAreaClick}
                    >
                      Choose PDF
                    </button>
                  </div>
                </div>

                {/* Feature 2: Paste or Type Plain Text */}
                <div className="bg-surface border border-border rounded-2xl md:rounded-3xl p-6 sm:p-8 flex flex-col shadow-sm transition-all duration-200 hover:border-primary hover:shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center shrink-0 shadow-xs">
                      <FileTextIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-foreground leading-tight">
                        Paste or Type Text
                      </h3>
                      <span className="text-xs text-muted">Articles, notes, speeches, and study material</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted mb-2 px-0.5 font-mono">
                    <span className="font-sans font-medium text-foreground">Paste plain text:</span>
                    <div className="flex items-center gap-1.5">
                      <span>{wordCount} words</span>
                      <span>•</span>
                      <span>{charCount} chars</span>
                      {wordCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-primary font-semibold font-sans">
                            ~{estimatedReadMinutes} min listen
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <textarea
                    className="w-full flex-1 min-h-[170px] p-3.5 rounded-xl border border-border bg-background text-foreground text-sm leading-relaxed resize-y outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 mb-4"
                    placeholder="Paste or type text here to open in the reader…"
                    value={textInput}
                    onChange={(e) => {
                      setTextInput(e.target.value);
                      try {
                        localStorage.setItem(TEXT_CACHE_KEY, e.target.value);
                      } catch { }
                    }}
                    rows={6}
                  />

                  <div className="flex flex-wrap items-center gap-2 justify-between pt-2 border-t border-border/60">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg bg-navbar-control border border-navbar-control-border text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                        onClick={handleLoadSampleText}
                      >
                        <SparklesIcon size={13} className="text-primary" />
                        <span>Sample Text</span>
                      </button>

                      {textInput && (
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg bg-navbar-control border border-navbar-control-border text-xs font-semibold text-muted hover:text-error hover:border-error transition-colors cursor-pointer flex items-center gap-1.5"
                          onClick={handleTextClear}
                        >
                          <TrashIcon size={13} />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-md hover:bg-primary-hover hover:scale-102 active:scale-98 transition-all cursor-pointer border-0 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={handleTextLoad}
                      disabled={!textInput.trim()}
                    >
                      <BookOpenIcon size={16} />
                      <span>Open in Reader</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section
              aria-labelledby="how-it-works-heading"
              className="w-full pt-8 border-t border-border/70"
            >
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2
                  id="how-it-works-heading"
                  className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground"
                >
                  Start Listening in 3 Steps
                </h2>
                <p className="text-sm sm:text-base text-muted mt-2">
                  No account required. Your document is processed directly in the browser.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white font-heading font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                    1
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Upload or Paste
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Upload a PDF or paste your text into the reader.
                  </p>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white font-heading font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                    2
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Choose Voice &amp; Speed
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Choose from neural or system voices and adjust the playback speed from 0.75× to 2×.
                  </p>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-primary text-white font-heading font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                    3
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Listen &amp; Follow Along
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Listen while each sentence is highlighted. Select any sentence to jump to that point, or enable auto-scroll to follow along automatically.
                  </p>
                </div>
              </div>
            </section>

            {/* SEPARATED, ROOMY FEATURES SECTION WITH CLEAR TYPOGRAPHY */}
            <section
              aria-labelledby="features-heading"
              className="w-full pt-8 border-t border-border/70"
            >
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2
                  id="features-heading"
                  className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground"
                >
                  Built for Comfortable Reading and Listening
                </h2>
                <p className="text-sm sm:text-base text-muted mt-2">
                  Useful reading tools for papers, books, notes, and other long-form text.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Feature 1 */}
                <div className="p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-surface border border-border flex flex-col gap-3 shadow-xs transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center shadow-xs">
                    <ShieldIcon size={24} />
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                    Local PDF Processing
                  </h3>
                  <p className="text-sm sm:text-base text-muted leading-relaxed">
                    PDFs and pasted text are processed in your browser. Local Kokoro voices also run directly on your device.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-surface border border-border flex flex-col gap-3 shadow-xs transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center shadow-xs">
                    <AutoScrollIcon size={24} />
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                    Synchronized Sentence Highlighting
                  </h3>
                  <p className="text-sm sm:text-base text-muted leading-relaxed">
                    The current sentence is highlighted as you listen. Select any sentence to start playback from that point, and enable auto-scroll to follow the document automatically.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-surface border border-border flex flex-col gap-3 shadow-xs transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center shadow-xs">
                    <VoiceIcon size={24} />
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                    Neural &amp; System Voices
                  </h3>
                  <p className="text-sm sm:text-base text-muted leading-relaxed">
                    Choose from 50+ Kokoro neural voices or voices provided by your browser and operating system. Adjust playback speed from 0.75× to 2×.
                  </p>
                </div>

                {/* Feature 4 */}
                <div className="p-6 sm:p-8 rounded-2xl md:rounded-3xl bg-surface border border-border flex flex-col gap-3 shadow-xs transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center shadow-xs">
                    <SmartphoneIcon size={24} />
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">
                    Mobile-Friendly Reader
                  </h3>
                  <p className="text-sm sm:text-base text-muted leading-relaxed">
                    Read and listen comfortably on phones and tablets with touch-friendly controls, auto-fit PDF pages, and a bottom playback bar.
                  </p>
                </div>
              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <section
              aria-labelledby="faq-heading"
              className="w-full pt-8 border-t border-border/70"
            >
              <div className="text-center max-w-2xl mx-auto mb-10">
                <h2
                  id="faq-heading"
                  className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground"
                >
                  Frequently Asked Questions
                </h2>
                <p className="text-sm sm:text-base text-muted mt-2">
                  Everything you need to know about using PDF Text to Speech Reader.
                </p>
              </div>

              <div className="max-w-3xl mx-auto flex flex-col gap-3.5">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-surface border border-border rounded-2xl overflow-hidden transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-5 sm:p-6 text-left font-heading font-bold text-base sm:text-lg text-foreground flex items-center justify-between gap-4 cursor-pointer border-0 bg-transparent hover:text-primary transition-colors"
                        aria-expanded={isOpen}
                      >
                        <span>{faq.q}</span>
                        <span className="text-muted shrink-0">
                          {isOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm sm:text-base text-muted leading-relaxed border-t border-border/40 pt-3 animate-fade-in-fast">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Brand Signature Footer */}
            <footer
              className="w-full text-center text-xs sm:text-sm text-muted py-4 border-t border-border/60"
              role="contentinfo"
            >
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span>PDF Text to Speech Reader — Crafted with care by</span>
                <a
                  href="https://github.com/imranpollob"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                >
                  Imran Pollob
                </a>
                <span className="text-muted/40">•</span>
                <a
                  href="https://github.com/imranpollob/pdf-text-to-speech-reader"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center text-muted hover:text-foreground transition-colors p-1 rounded-md hover:bg-navbar-control"
                  aria-label="GitHub Open Source Repository"
                  title="GitHub Open Source Repository"
                >
                  <GitHubIcon size={18} />
                </a>
              </div>
            </footer>
          </div>
        ) : (
          <>
            {file ? (
              <>
                <div className="w-full pt-4 pb-28 sm:pb-32">
                  <PdfViewer file={file} />
                </div>

                {/* Floating Page Navigator */}
                <PageNavigator />
              </>
            ) : (
              <div className="w-full mx-auto py-4 pb-28 sm:pb-32">
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Text Reader Mode
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-navbar-control border border-navbar-control-border text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                    onClick={handleTextEdit}
                  >
                    <EditIcon size={14} className="text-primary" />
                    <span>Edit Text</span>
                  </button>
                </div>
                <TextViewer />
              </div>
            )}

            {/* Desktop width resizer */}
            <div
              className="resizer absolute -right-2 top-10 bottom-10 w-3.5 cursor-ew-resize z-[500] flex items-center justify-center max-md:hidden after:content-[''] after:w-1 after:h-12 after:rounded-full after:bg-border after:transition-colors hover:after:bg-primary"
              role="separator"
              aria-orientation="vertical"
              title="Drag to resize reading width"
            />
          </>
        )}
      </div>

      {/* Floating Bottom Player Bar */}
      <PlayerBar />

      {/* Headless Audio Playback Engine */}
      <AudioEngine />
    </main>
  );
}

