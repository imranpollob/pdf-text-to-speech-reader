"use client";

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { AudioEngine } from '../components/AudioEngine';
import { TextViewer } from '../components/TextViewer';
import { useAudioStore } from '../store/use-audio-store';
import { normalizeRawText } from '../lib/text-normalizer';
import { cn } from '../lib/cn';

const PdfViewer = dynamic(() => import('../components/PdfViewer').then(mod => mod.PdfViewer), {
  ssr: false,
});

export default function Home() {
  const file = useAudioStore(state => state.file);
  const setFile = useAudioStore(state => state.setFile);
  const setDocumentTitle = useAudioStore(state => state.setDocumentTitle);
  const loadSegments = useAudioStore(state => state.loadSegments);
  const segments = useAudioStore(state => state.segments);

  const [pdfMaxWidth, setPdfMaxWidth] = useState<number>(1024);

  const TEXT_CACHE_KEY = 'pdf-text-to-speech-reader-text-input';
  const [textInput, setTextInput] = useState('');
  const [textLoaded, setTextLoaded] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [showTextEntry, setShowTextEntry] = useState(false);

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
      const sampleFile = new File([blob], 'PDF-Text-to-Speech-Reader-Sample.pdf', { type: 'application/pdf' });
      setFile(sampleFile);
      setTextLoaded(false);
    } catch (e) {
      console.error('Error loading sample PDF:', e);
    } finally {
      setIsLoadingSample(false);
    }
  };

  const handleLoadSampleText = () => {
    const sample = `Welcome to PDF Text to Speech Reader, an intelligent PDF and text reader with synchronized text-to-speech. Upload any PDF document or paste your own text to listen effortlessly with high clarity.

As speech plays, each sentence is accurately tracked and highlighted on your screen in real time. You can click on any sentence to jump directly to it, change voices, or adjust the playback speed to match your reading flow.

Designed with a focus on simplicity, accessibility, and complete privacy, PDF Text to Speech Reader processes your documents entirely on your device. Enjoy your reading experience!`;
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
    setFile(null); // Clear any PDF
  };

  const handleTextEdit = () => {
    setTextLoaded(false);
    loadSegments([]);
    setShowTextEntry(true);
  };

  const handleTextClear = () => {
    setTextInput('');
    try {
      localStorage.removeItem(TEXT_CACHE_KEY);
    } catch { }
  };

  // Reset to home when file and segments are cleared
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

  // Resizer logic for adjusting PDF max width on desktop
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
      startWidth = (document.querySelector('.the-pdf-viewer') as HTMLElement)?.clientWidth || pdfMaxWidth;
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
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
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

  const brandBtnBase =
    'inline-flex items-center justify-center gap-2 px-[18px] py-[9px] rounded-token text-sm font-semibold cursor-pointer border border-transparent transition-all duration-150 whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed max-[480px]:w-full';
  const brandBtnPrimary =
    'bg-primary text-white shadow-[0_2px_8px_color-mix(in_srgb,var(--color-primary)_28%,transparent)] enabled:hover:bg-primary-hover enabled:hover:-translate-y-px enabled:hover:shadow-[0_4px_12px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]';
  const brandBtnGhost =
    'bg-transparent border-border text-foreground enabled:hover:border-primary enabled:hover:text-primary enabled:hover:bg-primary-subtle';
  const brandBtnSubtle =
    'bg-primary-subtle text-primary enabled:hover:bg-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]';

  return (
    <main className="w-full pt-6 pb-12 flex flex-col items-center min-h-[calc(100vh-84px)]">
      <div
        className={cn(
          'the-pdf-viewer relative w-full flex flex-col items-center',
          showEmptyState && 'justify-center min-h-[calc(100vh-120px)]'
        )}
        style={{ maxWidth: `${pdfMaxWidth}px` }}
      >
        {showEmptyState ? (
          <div className="w-full max-w-[860px] mx-auto px-[clamp(16px,4vw,28px)] flex flex-col gap-5 animate-fade-in-slow">
            {/* Hero Section */}
            <section className="text-center flex flex-col items-center pt-2" aria-label="PDF Text to Speech Reader Overview">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase text-primary bg-primary-subtle border border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] rounded-full px-3.5 py-1 mb-3">
                <span className="w-[7px] h-[7px] rounded-full bg-primary animate-pulse-dot" />
                <span>Professional Audio Document Reader</span>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl leading-[1.15] font-extrabold text-foreground mb-2.5 tracking-tight">
                Read &amp; Listen with Synchronized Highlighting
              </h1>
              <p className="text-base md:text-md leading-[1.6] text-muted max-w-[620px] mx-auto">
                Upload PDFs or paste text to hear natural speech synthesis. Click any sentence to listen,
                track sentences in real time, and adjust speeds with zero friction.
              </p>
            </section>

            {/* Input Options: PDF upload and text paste */}
            {showTextEntry ? (
              <div>
                <button
                  type="button"
                  className="text-sm text-muted hover:text-primary transition-colors duration-150 mb-3 bg-transparent border-0 cursor-pointer"
                  onClick={() => setShowTextEntry(false)}
                >
                  ← Back to upload options
                </button>

                <div className="bg-surface border border-border rounded-token p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-subtle text-primary flex items-center justify-center shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </div>
                      <div className="font-heading text-lg font-bold text-foreground leading-tight">Paste Your Text</div>
                    </div>
                    <div className="text-muted font-mono text-xs flex items-center gap-1.5 max-[480px]:hidden">
                      <span>{wordCount} words</span>
                      <span className="text-border">•</span>
                      <span>{charCount} characters</span>
                    </div>
                  </div>

                  <textarea
                    className="w-full min-h-[220px] p-3.5 rounded-lg border border-border bg-background text-foreground text-base leading-[1.6] resize-y outline-none transition-[border-color,box-shadow] duration-150 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-subtle)]"
                    placeholder="Paste an article, paragraph, speech, or notes here…"
                    value={textInput}
                    onChange={(e) => {
                      setTextInput(e.target.value);
                      try {
                        localStorage.setItem(TEXT_CACHE_KEY, e.target.value);
                      } catch { }
                    }}
                    rows={10}
                    autoFocus
                  />

                  <div className="flex justify-between items-center gap-3 flex-wrap">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={cn(brandBtnBase, brandBtnGhost, 'text-xs')}
                        onClick={handleLoadSampleText}
                      >
                        Insert Sample Text
                      </button>
                      {textInput && (
                        <button
                          type="button"
                          className={cn(brandBtnBase, brandBtnSubtle, 'text-xs')}
                          onClick={handleTextClear}
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      className={cn(brandBtnBase, brandBtnPrimary)}
                      onClick={handleTextLoad}
                      disabled={!textInput.trim()}
                    >
                      <span>🔊 Read Aloud</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 items-stretch max-md:grid-cols-1">
                {/* Upload PDF */}
                <div
                  className={cn(
                    'group bg-surface border-2 border-dashed border-border rounded-token p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-200 shadow-sm hover:border-primary hover:bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-surface))] hover:-translate-y-0.5',
                    dragActive && 'border-primary! bg-primary-subtle! outline-3 outline-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] outline-offset-4'
                  )}
                  onClick={handleDropAreaClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleDropAreaClick();
                    }
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="w-14 h-14 rounded-full bg-primary-subtle text-primary flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-[1.08]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>

                  <div className="font-heading text-lg font-bold text-foreground mb-1">Upload a PDF</div>
                  <div className="text-sm text-muted mb-5">Drag &amp; drop, or browse your device</div>

                  <div className="flex flex-wrap gap-3 justify-center mt-auto max-[480px]:flex-col max-[480px]:w-full">
                    <button
                      type="button"
                      className={cn(brandBtnBase, brandBtnPrimary)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropAreaClick();
                      }}
                    >
                      Browse PDF File
                    </button>

                    <button
                      type="button"
                      className={cn(brandBtnBase, brandBtnGhost)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadSamplePdf();
                      }}
                      disabled={isLoadingSample}
                    >
                      {isLoadingSample ? 'Loading Sample…' : '✨ Try Sample'}
                    </button>
                  </div>
                </div>

                {/* Paste Text */}
                <div className="bg-surface border border-border rounded-token p-6 flex flex-col items-center text-center shadow-sm transition-all duration-200 hover:border-primary hover:-translate-y-0.5">
                  <div className="w-14 h-14 rounded-full bg-primary-subtle text-primary flex items-center justify-center mb-3">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </div>

                  <div className="font-heading text-lg font-bold text-foreground mb-1">Paste Your Text</div>
                  <div className="text-sm text-muted mb-5">Articles, notes, speeches — anything</div>

                  <button
                    type="button"
                    className={cn(brandBtnBase, brandBtnPrimary, 'mt-auto')}
                    onClick={() => setShowTextEntry(true)}
                  >
                    Paste Text
                  </button>
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div className="inline-flex items-center justify-center gap-2 text-xs text-muted px-4 py-2 rounded-full bg-surface border border-border mx-auto">
              <span>Shortcuts:</span>
              <kbd className="bg-background border border-border rounded px-1.5 py-0.5 text-xs shadow-[0_1px_1px_rgba(0,0,0,0.08)] text-foreground">Space</kbd> Play / Pause
              <span className="text-border">•</span>
              <kbd className="bg-background border border-border rounded px-1.5 py-0.5 text-xs shadow-[0_1px_1px_rgba(0,0,0,0.08)] text-foreground">←</kbd>{' '}
              <kbd className="bg-background border border-border rounded px-1.5 py-0.5 text-xs shadow-[0_1px_1px_rgba(0,0,0,0.08)] text-foreground">→</kbd> Prev / Next Sentence
              <span className="text-border">•</span>
              <kbd className="bg-background border border-border rounded px-1.5 py-0.5 text-xs shadow-[0_1px_1px_rgba(0,0,0,0.08)] text-foreground">Esc</kbd> Close Menus
            </div>

            {/* Brand Signature Footer */}
            <footer className="text-center text-sm text-muted pt-1" role="contentinfo">
              <p>
                Crafted with care by{' '}
                <a
                  href="https://github.com/imranpollob"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary no-underline font-semibold transition-[text-decoration] duration-150 hover:underline"
                >
                  Imran Pollob
                </a>
                {' '}•{' '}
                <a
                  href="https://github.com/imranpollob/pdf-text-to-speech-reader"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary no-underline font-semibold transition-[text-decoration] duration-150 hover:underline"
                >
                  GitHub Repository
                </a>
              </p>
            </footer>
          </div>
        ) : file ? (
          <>
            <PdfViewer file={file} />
            <div
              className="resizer absolute -right-2 top-10 bottom-10 w-3.5 cursor-ew-resize z-[500] flex items-center justify-center max-md:hidden after:content-[''] after:w-1 after:h-12 after:rounded-full after:bg-border after:transition-colors after:duration-150 hover:after:bg-primary"
              role="separator"
              aria-orientation="vertical"
            />
          </>
        ) : (
          <div className="w-full max-w-[860px] mx-auto py-2 px-4">
            <div className="flex justify-start mb-3">
              <button
                type="button"
                className={cn(brandBtnBase, brandBtnSubtle)}
                onClick={handleTextEdit}
              >
                ✏️ Edit Text
              </button>
            </div>
            <TextViewer />
          </div>
        )}
      </div>

      <AudioEngine />
    </main>
  );
}
