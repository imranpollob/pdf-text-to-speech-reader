'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AudioEngine } from '../components/AudioEngine';
import { TextViewer } from '../components/TextViewer';
import { FormattedDocumentViewer } from '../components/FormattedDocumentViewer';
import { PlayerBar } from '../components/PlayerBar';
import { PageNavigator } from '../components/PageNavigator';
import { useAudioStore } from '../store/use-audio-store';
import { normalizeRawText } from '../lib/text-normalizer';
import { readDocumentFile } from '../lib/document-import';
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

  const TEXT_CACHE_KEY = 'pdf-text-to-speech-reader-text-input';
  const [textInput, setTextInput] = useState('');
  const [textLoaded, setTextLoaded] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isImportingDocument, setIsImportingDocument] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formattedHtml, setFormattedHtml] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoPlaying, setDemoPlaying] = useState(true);

  // Cycle the highlighting preview (paused for reduced-motion users)
  useEffect(() => {
    if (!demoPlaying) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setDemoIndex((i) => (i + 1) % 3), 2200);
    return () => window.clearInterval(id);
  }, [demoPlaying]);

  // Restore cached text
  useEffect(() => {
    const cached = localStorage.getItem(TEXT_CACHE_KEY);
    if (cached) setTextInput(cached.replaceAll('PDF Text to Speech Reader', 'ReadAloud'));
  }, []);

  const openDocumentFile = async (selected: File) => {
    const extension = selected.name.split('.').pop()?.toLowerCase();
    setFileError(null);

    if (extension === 'pdf' || selected.type === 'application/pdf') {
      setFormattedHtml(null);
      setFile(selected);
      setTextLoaded(false);
      return;
    }

    setIsImportingDocument(true);
    try {
      const imported = await readDocumentFile(selected);
      const segs = normalizeRawText(imported.text);
      if (!segs.length) throw new Error('No readable text was found in this document.');

      setFile(null);
      setTextInput(imported.text);
      setFormattedHtml(imported.html);
      setDocumentTitle(selected.name);
      loadSegments(segs);
      setTextLoaded(true);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Could not read this document.');
    } finally {
      setIsImportingDocument(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.currentTarget.value = '';
    if (selected) void openDocumentFile(selected);
  };

  const handleLoadSamplePdf = async () => {
    try {
      setIsLoadingSample(true);
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/hello.pdf`);
      if (!response.ok) throw new Error('Sample PDF not found');
      const blob = await response.blob();
      const sampleFile = new File([blob], 'ReadAloud-Sample.pdf', {
        type: 'application/pdf',
      });
      setFile(sampleFile);
      setFormattedHtml(null);
      setTextLoaded(false);
    } catch (e) {
      console.error('Error loading sample PDF:', e);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleLoadSampleText = () => {
    const sample = `Welcome to ReadAloud. This is sample text, so you can try listening right away. Open it in the reader, press play, and follow along as each sentence is highlighted. You can also select any sentence to start listening from that point.`;
    setTextInput(sample);
    try {
      localStorage.setItem(TEXT_CACHE_KEY, sample);
    } catch { }
  };

  const handleTextLoad = () => {
    if (!textInput.trim()) return;
    setFormattedHtml(null);
    const segs = normalizeRawText(textInput);
    setDocumentTitle('Pasted Text Document');
    loadSegments(segs);
    setTextLoaded(true);
    setFile(null); // Clear PDF if any
  };

  const handleTextEdit = () => {
    setFormattedHtml(null);
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      void openDocumentFile(e.dataTransfer.files[0]);
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
      q: 'Is ReadAloud free?',
      a: 'Yes. ReadAloud is free and open-source, with no account required. Document files are parsed in your browser.',
    },
    {
      q: 'Are my documents uploaded?',
      a: 'Document files are parsed in your browser and are not uploaded by ReadAloud. If you enable the optional Kokoro voices, sentences are sent to the Kokoro server URL you configure to generate audio.',
    },
    {
      q: 'Which formats are supported?',
      a: 'PDF, DOCX, TXT and Markdown files with selectable text, plus text you paste. Scanned image-only PDFs need OCR first, because they have no text layer to read.',
    },
    {
      q: 'Can I paste text instead of uploading?',
      a: 'Yes. Paste or type text to listen with the same synchronized highlighting and playback controls.',
    },
    {
      q: 'How does synchronized highlighting work?',
      a: 'The sentence being spoken is highlighted as you listen. Select any sentence to start playback from there.',
    },
    {
      q: 'Which voices can I use?',
      a: 'Use voices from your browser and operating system, or connect an optional Kokoro server you run for additional neural voices. Playback speed runs from 0.75x to 2x.',
    },
    {
      q: 'Does ReadAloud work on phones and tablets?',
      a: 'Yes. Controls are touch-friendly, PDF pages fit your screen, and playback stays in a bottom bar.',
    },
  ];

  return (
    <main className="w-full flex flex-col items-center min-h-[calc(100vh-64px)] px-4 sm:px-6">
      <div
        className={cn(
          'relative w-full flex flex-col items-center',
          showEmptyState && 'max-w-7xl pt-4 sm:pt-6 pb-0'
        )}
      >
        {showEmptyState ? (
          <div className="w-full flex flex-col gap-8 sm:gap-10 animate-fade-in-slow">
            {/* Hero Section */}
            <section
              className="text-center flex flex-col items-center pt-2 max-w-3xl mx-auto w-full"
              aria-label="ReadAloud overview"
            >
              <p className="text-sm sm:text-base font-semibold text-primary">Listen, Read, Follow Along.</p>

              <h1 className="mt-2 font-heading text-3xl sm:text-4xl md:text-5xl leading-[1.15] font-extrabold text-foreground tracking-tight">
                Listen to any document, sentence by sentence.
              </h1>

              <p className="mt-4 text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
                Spend less time staring at long documents. Upload a file or paste text, choose a voice and speed, and listen hands-free.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleLoadSamplePdf}
                  disabled={isLoadingSample}
                  className="px-6 py-3 rounded-xl bg-primary text-on-primary font-semibold text-base shadow-md hover:bg-primary-hover transition-colors cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingSample ? 'Loading sample\u2026' : 'Try Sample Document'}
                </button>
                <a
                  href="#upload-dropzone"
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById('upload-dropzone');
                    if (!el) return;
                    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
                    el.focus({ preventScroll: true });
                  }}
                  className="px-6 py-3 rounded-xl bg-surface border border-border text-foreground font-semibold text-base hover:border-primary hover:text-primary transition-colors"
                >
                  Upload or Paste Text
                </a>
              </div>
              <p className="mt-3 text-base text-muted">No account needed. Documents are parsed locally in your browser.</p>

              <ul className="mt-5 flex flex-wrap justify-center gap-2 list-none p-0" aria-label="Supported formats">
                {['PDF', 'DOCX', 'TXT', 'Markdown', 'Pasted text'].map((f) => (
                  <li key={f} className="px-3 py-1 rounded-full bg-primary-subtle text-primary text-sm font-semibold">{f}</li>
                ))}
              </ul>

              {/* Compact synchronized-highlighting preview */}
              <div className="mt-7 w-full max-w-2xl text-left bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="font-heading font-bold text-base text-foreground">Preview: synchronized highlighting</span>
                  <button
                    type="button"
                    onClick={() => setDemoPlaying((v) => !v)}
                    aria-label={demoPlaying ? 'Pause highlighting preview' : 'Play highlighting preview'}
                    className="px-3 py-1.5 rounded-lg bg-navbar-control border border-navbar-control-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    {demoPlaying ? 'Pause' : 'Play'}
                  </button>
                </div>
                <p className="text-base leading-relaxed text-foreground">
                  {[
                    'ReadAloud speaks one sentence at a time.',
                    'The sentence you hear is highlighted as it plays.',
                    'Select any sentence to start listening from there.',
                  ].map((s, i) => (
                    <span
                      key={s}
                      aria-current={demoIndex === i ? 'true' : undefined}
                      className={demoIndex === i ? 'bg-highlight-bg text-highlight-text rounded px-1 -mx-0.5 font-medium' : undefined}
                    >
                      {s}{' '}
                    </span>
                  ))}
                </p>
                <p className="mt-3 text-base text-muted">This is how playback follows along in the reader.</p>
              </div>
            </section>

            {/* DUAL INPUT SECTION: Upload PDF & Paste Text with Equal Prominence */}
            <section
              id="get-started"
              aria-label="Upload document or paste text"
              className="w-full"
            >
              <div className="text-center mb-6">
                <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                  Choose How You Want to Read
                </h2>
                <p className="text-base text-muted mt-1">Upload a document or paste text — both open in the same reader.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Feature 1: Upload Document File */}
                <div
                  className={cn(
                    'bg-surface border border-border rounded-2xl p-6 sm:p-7 flex flex-col shadow-sm transition-colors duration-200 hover:border-primary hover:shadow-md',
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
                    accept=".pdf,.md,.markdown,.txt,.docx,application/pdf,text/markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center shrink-0 shadow-xs">
                      <UploadCloudIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-foreground leading-tight">
                        Upload a Document
                      </h3>
                      <span className="text-base text-muted">Research papers, books, essays, and reports</span>
                    </div>
                  </div>

                  <p className="text-base text-muted mb-6 leading-relaxed">
                    Choose a PDF, Markdown, TXT, or DOCX file, or drag it here. The document is processed
                    for reading and synchronized sentence playback.
                  </p>

                  <div
                    onClick={handleDropAreaClick}
                    className="mt-auto border-2 border-dashed border-border/80 hover:border-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 bg-background/50 hover:bg-background rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group mb-4"
                    id="upload-dropzone" aria-label="Choose a document to upload" role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleDropAreaClick();
                      }
                    }}
                  >
                    <UploadCloudIcon size={32} className="text-primary mb-2 transition-transform duration-200 " />
                    <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      Choose a document
                    </span>
                    <span className="text-base text-muted mt-0.5">PDF, DOCX, TXT, Markdown — or drop a file here</span>
                  </div>

                  {fileError && (
                    <p role="alert" className="text-sm text-error mb-3">{fileError}</p>
                  )}
                  {isImportingDocument && (
                    <p role="status" className="text-sm text-muted mb-3">Reading document…</p>
                  )}

                  <p className="text-base text-muted leading-relaxed pt-3 border-t border-border/60">
                    No fixed file-size limit. Files are opened locally in your browser, so very large documents may take longer to load.
                  </p>
                </div>

                {/* Feature 2: Paste or Type Plain Text */}
                <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 flex flex-col shadow-sm transition-colors duration-200 hover:border-primary hover:shadow-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-subtle text-primary flex items-center justify-center shrink-0 shadow-xs">
                      <FileTextIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-foreground leading-tight">
                        Paste or Type Text
                      </h3>
                      <span className="text-base text-muted">Articles, notes, speeches, and study material</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted mb-2 px-0.5 font-mono">
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

                  <label htmlFor="paste-text" className="sr-only">Paste or type text to listen to</label>
                  <textarea
                    id="paste-text"
                    aria-describedby="open-reader-hint"
                    className="w-full flex-1 min-h-[170px] p-3.5 rounded-xl border border-border bg-background text-foreground text-base leading-relaxed resize-y outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 mb-4"
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
                        className="px-4 py-2.5 rounded-lg bg-primary-subtle border border-primary/40 text-sm font-semibold text-primary hover:bg-primary hover:text-on-primary transition-colors cursor-pointer flex items-center gap-1.5"
                        onClick={handleLoadSampleText}
                      >
                        <SparklesIcon size={13} className="text-primary" />
                        <span>Sample Text</span>
                      </button>

                      {textInput && (
                        <button
                          type="button"
                          className="px-3 py-2 rounded-lg bg-navbar-control border border-navbar-control-border text-sm font-semibold text-muted hover:text-error hover:border-error transition-colors cursor-pointer flex items-center gap-1.5"
                          onClick={handleTextClear}
                        >
                          <TrashIcon size={13} />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm shadow-md hover:bg-primary-hover transition-colors cursor-pointer border-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                      onClick={handleTextLoad}
                      disabled={!textInput.trim()}
                    >
                      <BookOpenIcon size={16} />
                      <span>Open in Reader</span>
                    </button>
                  </div>
                  <p id="open-reader-hint" className="text-base text-muted mt-3">
                    {textInput.trim() ? 'Ready \u2014 open the text in the reader to start listening.' : 'Paste or type text above, or use Sample Text, to enable Open in Reader.'}
                  </p>
                </div>
              </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section
              aria-labelledby="how-it-works-heading"
              className="w-full pt-6 border-t border-border/70"
            >
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2
                  id="how-it-works-heading"
                  className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground"
                >
                  Start Listening in 3 Steps
                </h2>
                <p className="text-base text-muted mt-2">
                  No account required. Files are parsed in your browser.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-primary text-on-primary font-heading font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                    1
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Upload or Paste
                  </h3>
                  <p className="text-base text-muted leading-relaxed">
                    Upload a file or paste text.
                  </p>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-primary text-on-primary font-heading font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                    2
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Choose Voice &amp; Speed
                  </h3>
                  <p className="text-base text-muted leading-relaxed">
                    Pick a voice and a speed from 0.75x to 2x.
                  </p>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-6 sm:p-7 flex flex-col gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-primary text-on-primary font-heading font-extrabold text-lg flex items-center justify-center shrink-0 shadow-sm">
                    3
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground">
                    Listen &amp; Follow Along
                  </h3>
                  <p className="text-base text-muted leading-relaxed">
                    Follow the highlighted sentence. Select any sentence to jump to it.
                  </p>
                </div>
              </div>
            </section>

            {/* SEPARATED, ROOMY FEATURES SECTION WITH CLEAR TYPOGRAPHY */}
            <section
              aria-labelledby="features-heading"
              className="w-full pt-6 border-t border-border/70"
            >
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2
                  id="features-heading"
                  className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground"
                >
                  Why ReadAloud
                </h2>
                <p className="text-base text-muted mt-2">
                  Three things set ReadAloud apart when you listen to long documents.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 sm:p-7 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-sm transition-colors hover:border-primary">
                  <div className="w-12 h-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center">
                    <AutoScrollIcon size={24} />
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">Synchronized Highlighting</h3>
                  <p className="text-base text-muted leading-relaxed">The spoken sentence stays highlighted. Select any sentence to start playback there, with optional auto-scroll.</p>
                </div>
                <div className="p-6 sm:p-7 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-sm transition-colors hover:border-primary">
                  <div className="w-12 h-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center">
                    <ShieldIcon size={24} />
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">Local Processing</h3>
                  <p className="text-base text-muted leading-relaxed">Document files are parsed in your browser. Optional Kokoro audio uses only the server URL you configure.</p>
                </div>
                <div className="p-6 sm:p-7 rounded-2xl bg-surface border border-border flex flex-col gap-3 shadow-sm transition-colors hover:border-primary">
                  <div className="w-12 h-12 rounded-xl bg-primary-subtle text-primary flex items-center justify-center">
                    <VoiceIcon size={24} />
                  </div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground">Voice &amp; Speed Selection</h3>
                  <p className="text-base text-muted leading-relaxed">Choose browser or system voices and listen at 0.75x to 2x. Optional high-quality voices run on a server you set up. The reader also works on phones and tablets.</p>
                </div>
              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <section
              id="faq"
              aria-labelledby="faq-heading"
              className="w-full pt-6 border-t border-border/70"
            >
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2
                  id="faq-heading"
                  className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground"
                >
                  Frequently Asked Questions
                </h2>
                <p className="text-base text-muted mt-2">
                  Short answers about formats, voices and listening.
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
                        aria-controls={`faq-panel-${idx}`}
                        id={`faq-button-${idx}`}
                      >
                        <span>{faq.q}</span>
                        <span className="text-muted shrink-0">
                          {isOpen ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
                        </span>
                      </button>

                      {isOpen && (
                        <div id={`faq-panel-${idx}`} role="region" aria-labelledby={`faq-button-${idx}`} className="px-5 pb-5 sm:px-6 sm:pb-6 text-base text-muted leading-relaxed border-t border-border/40 pt-3 animate-fade-in-fast">
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
              className="w-full text-center text-sm text-muted py-4 border-t border-border/60"
              role="contentinfo"
            >
              <p className="mb-2">Free PDF &amp; text to speech reader for PDF, DOCX, TXT and Markdown.</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span>ReadAloud — Listen, Read, Follow Along. Crafted by</span>
                <a
                  href="https://github.com/imranpollob"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                >
                  Imran Pollob
                </a>
                <span className="text-muted/40">•</span>
                <a href="https://github.com/imranpollob/pdf-text-to-speech-reader" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">GitHub</a>
                <span className="text-muted/40">•</span>
                <a href="https://github.com/imranpollob/pdf-text-to-speech-reader/issues" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Feedback</a>
                <span className="text-muted/40">•</span>
                <a href="#faq" className="text-primary font-semibold hover:underline">Privacy</a>
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
              <div className="w-full max-w-4xl mx-auto py-4 pb-28 sm:pb-32">
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Document Reader Mode
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
                {formattedHtml ? (
                  <FormattedDocumentViewer html={formattedHtml} segments={segments} />
                ) : (
                  <TextViewer />
                )}
              </div>
            )}

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

