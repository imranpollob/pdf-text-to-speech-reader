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
  EditIcon,
  ChevronDownIcon,
  BookOpenIcon,
  PlayIcon,
  PauseIcon,
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
  const [isImportingDocument, setIsImportingDocument] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formattedHtml, setFormattedHtml] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoPlaying, setDemoPlaying] = useState(true);
  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload');

  // Cycle the highlighting preview; stays still for reduced-motion users
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDemoPlaying(false);
      return;
    }
    if (!demoPlaying) return;
    const id = window.setInterval(() => setDemoIndex((i) => (i + 1) % 3), 2200);
    return () => window.clearInterval(id);
  }, [demoPlaying]);

  // Pasted text is never stored; clear anything saved by earlier versions.
  useEffect(() => {
    try {
      localStorage.removeItem(TEXT_CACHE_KEY);
    } catch { }
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
      a: 'Yes. ReadAloud is free and open-source, with no account required.',
    },
    {
      q: 'Are my documents uploaded?',
      a: 'No. Files are parsed locally in your browser. The optional Kokoro voices only contact the voice-server address you enter in the app.',
    },
    {
      q: 'Which formats are supported?',
      a: 'PDF, DOCX, TXT and Markdown files with readable text, plus pasted text. Scanned image-only PDFs need OCR first.',
    },
    {
      q: 'Which voices can I use?',
      a: 'Voices from your browser and system, plus optional high-quality Kokoro voices. Speeds run from 0.75x to 2x, on phones and tablets too.',
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
          <div className="w-full max-w-[760px] mx-auto flex flex-col items-center animate-fade-in-slow pb-6">
            {/* Hero with the tool */}
            <section aria-label="ReadAloud" className="hero-section w-full text-center flex flex-col items-center pt-10 sm:pt-14">
              <p className="text-base font-semibold text-primary">Listen, Read, Follow Along.</p>
              <h1 className="mt-3 font-heading text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1] font-extrabold text-foreground tracking-tight">
                Listen to any document, <span className="headline-accent">sentence by sentence.</span>
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-muted max-w-xl mx-auto leading-relaxed">
                Upload a file or paste text, then listen hands-free.
              </p>

              {/* Single input card with tabs */}
              <div className="homepage-input-card mt-8 w-full text-left border rounded-[1.75rem] p-5 sm:p-7">
                <div role="tablist" aria-label="Choose how to add text" className="flex gap-1 mb-5 border-b border-border">
                  <button
                    type="button"
                    role="tab"
                    id="tab-upload"
                    aria-selected={inputTab === 'upload'}
                    aria-controls="panel-upload"
                    onClick={() => setInputTab('upload')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 min-h-[44px] font-semibold text-base border-0 border-b-2 bg-transparent cursor-pointer transition-colors -mb-px',
                      inputTab === 'upload'
                        ? 'text-primary border-primary'
                        : 'text-muted border-transparent hover:text-foreground'
                    )}
                  >
                    <UploadCloudIcon size={18} />
                    <span>Upload</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-paste"
                    aria-selected={inputTab === 'paste'}
                    aria-controls="panel-paste"
                    onClick={() => setInputTab('paste')}
                    className={cn(
                      'flex items-center gap-2 px-4 py-3 min-h-[44px] font-semibold text-base border-0 border-b-2 bg-transparent cursor-pointer transition-colors -mb-px',
                      inputTab === 'paste'
                        ? 'text-primary border-primary'
                        : 'text-muted border-transparent hover:text-foreground'
                    )}
                  >
                    <FileTextIcon size={18} />
                    <span>Paste text</span>
                  </button>
                </div>

                {inputTab === 'upload' ? (
                  <div role="tabpanel" id="panel-upload" aria-labelledby="tab-upload">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.md,.markdown,.txt,.docx,application/pdf,text/markdown,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      className="hidden"
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                    <div
                      onClick={handleDropAreaClick}
                      className={cn(
                        'homepage-dropzone border-2 border-dashed border-border/80 hover:border-primary focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 bg-background/50 hover:bg-background rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all',
                        dragActive && 'drag-active border-primary bg-primary-subtle/30 ring-4 ring-primary/20'
                      )}
                      id="upload-dropzone"
                      aria-label="Drop a file or choose a document to upload"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDropAreaClick();
                        }
                      }}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <span className="upload-icon-wrap mb-4">
                        <UploadCloudIcon size={30} className="text-primary" />
                      </span>
                      <span className="text-base sm:text-lg font-bold text-foreground">
                        Drop a file here or click to browse
                      </span>
                      <span className="mt-2 text-sm text-muted">PDF · DOCX · TXT · Markdown</span>
                    </div>
                    <p className="mt-3 text-sm text-muted">
                      No fixed file-size limit. Very large files may take longer to open.
                    </p>
                    {fileError && (
                      <p role="alert" className="text-base text-error mt-3">{fileError}</p>
                    )}
                    {isImportingDocument && (
                      <p role="status" className="text-base text-muted mt-3">Reading document…</p>
                    )}
                  </div>
                ) : (
                  <div role="tabpanel" id="panel-paste" aria-labelledby="tab-paste">
                    <label htmlFor="paste-text" className="sr-only">Paste or type text to listen to</label>
                    <textarea
                      id="paste-text"
                      className="w-full min-h-[170px] p-4 rounded-xl border border-border bg-background text-foreground text-base leading-relaxed resize-y outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="Paste or type the text you want to hear…"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={6}
                    />
                    {textInput.trim() ? (
                      <p className="mt-3 text-sm text-muted">
                        {wordCount} {wordCount === 1 ? 'word' : 'words'} · about {estimatedReadMinutes} min listen
                      </p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="px-6 py-3 min-h-[44px] rounded-xl bg-primary text-on-primary font-semibold text-base shadow-md hover:bg-primary-hover transition-colors cursor-pointer border-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        onClick={handleTextLoad}
                        disabled={!textInput.trim()}
                        aria-describedby="open-reader-hint"
                      >
                        <BookOpenIcon size={16} />
                        <span>Open in Reader</span>
                      </button>
                    </div>
                    <p id="open-reader-hint" className="sr-only">
                      {textInput.trim() ? 'Open the text in the reader to start listening.' : 'Paste or type text above to enable Open in Reader.'}
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-muted">Runs in your browser. No account needed.</p>
            </section>

            {/* Highlight preview */}
            <section aria-label="Synchronized highlighting preview" className="w-full mt-14 sm:mt-20">
              <div className="reader-preview relative overflow-hidden rounded-[1.75rem] border p-6 sm:p-9">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="text-sm font-semibold text-muted uppercase tracking-wider flex items-center gap-3">
                    Preview
                    <span className="sound-wave" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDemoPlaying((v) => !v)}
                    aria-label={demoPlaying ? 'Pause highlighting preview' : 'Play highlighting preview'}
                    className="preview-control h-10 w-10 shrink-0 rounded-full bg-navbar-control border border-navbar-control-border text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer inline-flex items-center justify-center"
                  >
                    {demoPlaying ? <PauseIcon size={17} /> : <PlayIcon size={17} />}
                  </button>
                </div>
                <p className="reader-copy text-lg sm:text-xl leading-[1.85] text-foreground">
                  {[
                    'The harbor town woke slowly as gulls circled the lighthouse.',
                    'ReadAloud reads each sentence aloud while the words light up in time.',
                    'Select any sentence to jump straight to it, at your own pace.',
                  ].map((s, i) => (
                    <span
                      key={s}
                      aria-current={demoIndex === i ? 'true' : undefined}
                      className={cn('reader-sentence', demoIndex === i && 'is-highlighted')}
                    >
                      {s}{' '}
                    </span>
                  ))}
                </p>
                <div className="preview-progress mt-6" role="presentation" aria-hidden="true">
                  <span style={{ width: `${((demoIndex + 1) / 3) * 100}%` }} />
                </div>
              </div>
              <p className="helper-copy mt-4 text-center text-sm">
                Sentence highlighting · Private, in-browser · Adjustable voice and speed
              </p>
            </section>

            {/* FAQ */}
            <section
              id="faq"
              aria-labelledby="faq-heading"
              className="w-full mt-14 sm:mt-20"
            >
              <h2
                id="faq-heading"
                className="font-heading text-xl sm:text-2xl font-extrabold text-foreground text-center"
              >
                Frequently asked questions
              </h2>

              <div className="mt-6 flex flex-col gap-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={cn('faq-item rounded-2xl overflow-hidden', isOpen && 'is-open')}
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(idx)}
                        className="faq-trigger w-full p-5 sm:p-6 min-h-[44px] text-left font-heading font-bold text-sm sm:text-base text-foreground flex items-center justify-between gap-4 cursor-pointer border-0 bg-transparent transition-colors"
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${idx}`}
                        id={`faq-button-${idx}`}
                      >
                        <span>{faq.q}</span>
                        <span className={cn('faq-chevron text-muted shrink-0', isOpen && 'is-open')}>
                          <ChevronDownIcon size={18} />
                        </span>
                      </button>

                      <div id={`faq-panel-${idx}`} role="region" aria-labelledby={`faq-button-${idx}`} className={cn('faq-answer', isOpen && 'is-open')} aria-hidden={!isOpen}>
                        <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-base text-muted leading-relaxed border-t border-border/40 pt-3">
                          {faq.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Footer */}
            <footer
              className="w-full text-center text-sm text-muted mt-20 sm:mt-28 py-6"
              role="contentinfo"
            >
              <p>Free PDF &amp; text to speech reader for PDF, DOCX, TXT and Markdown.</p>
              <p className="mt-2">
                <span>ReadAloud, crafted by </span>
                <a
                  href="https://github.com/imranpollob"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold hover:underline"
                >
                  Imran Pollob
                </a>
                <span> · </span>
                <a href="https://github.com/imranpollob/pdf-text-to-speech-reader" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">GitHub</a>
                <span> · </span>
                <a href="https://github.com/imranpollob/pdf-text-to-speech-reader/issues" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">Feedback</a>
                <span> · </span>
                <a href="#faq" className="text-primary font-semibold hover:underline">Privacy</a>
              </p>
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

