'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useAudioStore } from '../store/use-audio-store';
import { cn } from '../lib/cn';
import {
  ArrowLeftIcon,
  ZoomInIcon,
  ZoomOutIcon,
  FitWidthIcon,
  SunIcon,
  MoonIcon,
  KeyboardIcon,
  ClockIcon,
  CloseIcon,
} from './Icons';

export default function Header() {
  const file = useAudioStore((s) => s.file);
  const setFile = useAudioStore((s) => s.setFile);
  const documentTitle = useAudioStore((s) => s.documentTitle);
  const segments = useAudioStore((s) => s.segments);
  const loadSegments = useAudioStore((s) => s.loadSegments);
  const currentSegmentIndex = useAudioStore((s) => s.currentSegmentIndex);
  const playbackSpeed = useAudioStore((s) => s.playbackSpeed);
  const scale = useAudioStore((s) => s.scale);
  const zoomIn = useAudioStore((s) => s.zoomIn);
  const zoomOut = useAudioStore((s) => s.zoomOut);
  const zoomReset = useAudioStore((s) => s.zoomReset);
  const isFitToWidth = useAudioStore((s) => s.isFitToWidth);
  const setIsFitToWidth = useAudioStore((s) => s.setIsFitToWidth);
  const textFontSize = useAudioStore((s) => s.textFontSize);
  const increaseFontSize = useAudioStore((s) => s.increaseFontSize);
  const decreaseFontSize = useAudioStore((s) => s.decreaseFontSize);
  const resetFontSize = useAudioStore((s) => s.resetFontSize);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const hasContent = segments.length > 0 || file !== null;

  // Initialize theme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved === 'dark' || (!saved && prefersDark) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', initial);
    queueMicrotask(() => {
      setTheme(initial);
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
    }
  };

  const currentZoomPercent = Math.round((scale / 1.5) * 100);

  const handleGoHome = () => {
    setFile(null);
    loadSegments([]);
  };

  // Estimated reading time listened and total (150 words/min speech rate adjusted for playback speed)
  const timeMetrics = useMemo(() => {
    if (!segments.length) return null;

    const wordsPerMinute = 150 * playbackSpeed;

    const formatTime = (words: number) => {
      const minutes = words / wordsPerMinute;
      if (words === 0) return '0m';
      if (minutes < 1) return '<1m';
      const roundMins = Math.round(minutes);
      return `${roundMins}m`;
    };

    // Words listened up to current segment
    const listenedSegments = segments.slice(0, currentSegmentIndex);
    const listenedWords = listenedSegments.reduce(
      (acc, seg) => acc + (seg.text.trim().split(/\s+/).filter(Boolean).length || 0),
      0
    );

    // Total words in entire document
    const totalWords = segments.reduce(
      (acc, seg) => acc + (seg.text.trim().split(/\s+/).filter(Boolean).length || 0),
      0
    );

    // Remaining words
    const remainingSegments = segments.slice(currentSegmentIndex);
    const remainingWords = remainingSegments.reduce(
      (acc, seg) => acc + (seg.text.trim().split(/\s+/).filter(Boolean).length || 0),
      0
    );

    return {
      listened: formatTime(listenedWords),
      total: formatTime(totalWords),
      remaining: formatTime(remainingWords),
    };
  }, [segments, currentSegmentIndex, playbackSpeed]);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 h-16 z-[1000] bg-navbar/95 backdrop-blur-md border-b border-navbar-border shadow-xs transition-[background-color,border-color] duration-200"
        role="banner"
      >
        <div className="w-full max-w-7xl h-full mx-auto flex items-center justify-between gap-3 px-4 sm:px-6">
          {/* Brand & Document identification */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleGoHome}
              className="flex items-center gap-2.5 text-foreground cursor-pointer shrink-0 border-0 bg-transparent p-0 group"
              title="Return to Home / Upload"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden border-[1.5px] border-primary flex items-center justify-center bg-navbar-control shadow-[0_2px_6px_color-mix(in_srgb,var(--color-primary)_20%,transparent)] transition-transform duration-200 group-hover:scale-105">
                <Image
                  src="./brand-logo.png"
                  alt="Brand Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <span className="font-heading font-bold text-base tracking-tight text-foreground whitespace-nowrap">
                <span className="hidden sm:inline">PDF Text to Speech Reader</span>
                <span className="sm:hidden">PDF Reader</span>
              </span>
            </button>

            {/* Active Document Badge */}
            {hasContent && (
              <div
                className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-navbar-control border border-navbar-control-border max-w-[280px] sm:max-w-xs animate-fade-in"
                title={documentTitle || 'Active Document'}
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 bg-primary-subtle text-primary border-0 rounded-full px-2 py-0.5 text-xs font-semibold cursor-pointer transition-colors hover:bg-primary hover:text-white"
                  title="Close document and return to upload"
                  onClick={handleGoHome}
                >
                  <ArrowLeftIcon size={12} />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-1 text-xs overflow-hidden">
                  <span className="font-semibold whitespace-nowrap truncate max-w-[100px] sm:max-w-[140px] text-foreground">
                    {documentTitle || (file ? file.name : 'Pasted Text')}
                  </span>
                  {segments.length > 0 && (
                    <span className="text-muted font-mono whitespace-nowrap text-[11px]">
                      ({currentSegmentIndex + 1}/{segments.length})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Header Tools */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Reading Time Metrics (Compact Listened / Total Duration) */}
            {hasContent && timeMetrics && (
              <div
                className="hidden sm:inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-navbar-control border border-navbar-control-border text-xs font-mono text-muted shadow-2xs animate-fade-in select-none"
                title={`Reading Progress: ${timeMetrics.listened} listened of ${timeMetrics.total} total (~${timeMetrics.remaining} remaining)`}
              >
                <ClockIcon size={13} className="text-primary shrink-0" />
                <span className="text-foreground/90 font-medium">{timeMetrics.listened}</span>
                <span className="text-muted/50 font-normal">/</span>
                <span>{timeMetrics.total}</span>
              </div>
            )}

            {/* Zoom Controls (Visible when PDF is loaded on screens >= 640px) */}
            {file ? (
              <div
                className="hidden sm:inline-flex items-center bg-navbar-control border border-navbar-control-border rounded-xl overflow-hidden h-[34px] shadow-xs"
                role="group"
                aria-label="PDF zoom controls"
              >
                <button
                  type="button"
                  className="w-8 h-full flex items-center justify-center text-foreground hover:text-primary hover:bg-navbar-control-hover transition-colors border-0 bg-transparent cursor-pointer"
                  title="Zoom out (-)"
                  onClick={zoomOut}
                >
                  <ZoomOutIcon size={15} />
                </button>

                <button
                  type="button"
                  className="px-2 font-mono text-xs font-semibold text-foreground hover:text-primary hover:bg-navbar-control-hover border-y-0 border-x border-navbar-control-border h-full flex items-center justify-center transition-colors bg-transparent cursor-pointer"
                  title="Reset zoom to 100%"
                  onClick={zoomReset}
                >
                  {currentZoomPercent}%
                </button>

                <button
                  type="button"
                  className="w-8 h-full flex items-center justify-center text-foreground hover:text-primary hover:bg-navbar-control-hover transition-colors border-0 bg-transparent cursor-pointer"
                  title="Zoom in (+)"
                  onClick={zoomIn}
                >
                  <ZoomInIcon size={15} />
                </button>

                <button
                  type="button"
                  className={cn(
                    'px-2.5 h-full flex items-center gap-1 border-l border-navbar-control-border text-xs font-medium cursor-pointer transition-colors',
                    isFitToWidth
                      ? 'bg-primary text-white font-semibold'
                      : 'bg-transparent text-foreground hover:text-primary hover:bg-navbar-control-hover'
                  )}
                  title="Fit document to screen width"
                  onClick={() => setIsFitToWidth(!isFitToWidth)}
                >
                  <FitWidthIcon size={14} />
                  <span className="hidden lg:inline text-[11px]">Fit</span>
                </button>
              </div>
            ) : hasContent ? (
              /* Font Size Controls (Visible when Pasted Text is active on screens >= 640px) */
              <div
                className="hidden sm:inline-flex items-center bg-navbar-control border border-navbar-control-border rounded-xl overflow-hidden h-[34px] shadow-xs"
                role="group"
                aria-label="Text reader font size controls"
              >
                <button
                  type="button"
                  className="w-8 h-full flex items-center justify-center text-foreground hover:text-primary hover:bg-navbar-control-hover transition-colors border-0 bg-transparent cursor-pointer disabled:opacity-40"
                  title="Decrease font size"
                  disabled={textFontSize <= 12}
                  onClick={decreaseFontSize}
                >
                  <ZoomOutIcon size={15} />
                </button>

                <button
                  type="button"
                  className="px-2.5 font-mono text-xs font-semibold text-foreground hover:text-primary hover:bg-navbar-control-hover border-y-0 border-x border-navbar-control-border h-full flex items-center justify-center transition-colors bg-transparent cursor-pointer"
                  title="Reset font size to default (16px)"
                  onClick={resetFontSize}
                >
                  {textFontSize}px
                </button>

                <button
                  type="button"
                  className="w-8 h-full flex items-center justify-center text-foreground hover:text-primary hover:bg-navbar-control-hover transition-colors border-0 bg-transparent cursor-pointer disabled:opacity-40"
                  title="Increase font size"
                  disabled={textFontSize >= 32}
                  onClick={increaseFontSize}
                >
                  <ZoomInIcon size={15} />
                </button>
              </div>
            ) : null}

            {/* Keyboard Shortcuts Trigger */}
            <button
              type="button"
              className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-navbar-control border border-navbar-control-border text-foreground hover:text-primary hover:border-primary transition-colors cursor-pointer"
              title="Keyboard shortcuts"
              aria-label="Keyboard shortcuts"
              onClick={() => setShowShortcutsModal(true)}
            >
              <KeyboardIcon size={17} />
            </button>

            {/* Theme Toggle Button */}
            <button
              className="theme-switch relative w-[54px] h-7 rounded-full border border-navbar-control-border bg-navbar-control cursor-pointer shrink-0 p-0 transition-colors duration-200"
              id="themeSwitch"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              type="button"
              onClick={toggleTheme}
            >
              <SunIcon
                size={13}
                className="absolute top-1/2 -translate-y-1/2 text-muted left-[7px] pointer-events-none"
              />
              <MoonIcon
                size={13}
                className="absolute top-1/2 -translate-y-1/2 text-muted right-[7px] pointer-events-none"
              />
              <span className="thumb absolute top-0.5 left-0.5 w-[22px] h-[22px] rounded-full bg-primary text-white flex items-center justify-center transition-[left] duration-200 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]">
                <SunIcon size={13} className="sun-icon" />
                <MoonIcon size={13} className="moon-icon" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in-fast"
          onClick={() => setShowShortcutsModal(false)}
        >
          <div
            className="bg-surface border border-border rounded-2xl p-6 shadow-2xl w-full max-w-md animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-foreground font-heading font-bold text-lg">
                <KeyboardIcon size={20} className="text-primary" />
                <span>Keyboard Shortcuts</span>
              </div>
              <button
                type="button"
                className="text-muted hover:text-foreground bg-transparent border-0 cursor-pointer p-1"
                onClick={() => setShowShortcutsModal(false)}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3.5 my-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Play / Pause speech</span>
                <kbd className="bg-background border border-border px-2 py-1 rounded text-xs font-mono font-semibold shadow-xs">
                  Space
                </kbd>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Next sentence</span>
                <kbd className="bg-background border border-border px-2 py-1 rounded text-xs font-mono font-semibold shadow-xs">
                  → Right Arrow
                </kbd>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Previous sentence</span>
                <kbd className="bg-background border border-border px-2 py-1 rounded text-xs font-mono font-semibold shadow-xs">
                  ← Left Arrow
                </kbd>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Close menus &amp; popovers</span>
                <kbd className="bg-background border border-border px-2 py-1 rounded text-xs font-mono font-semibold shadow-xs">
                  Esc
                </kbd>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Direct sentence jump</span>
                <span className="text-foreground text-xs font-medium">Click any sentence</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm cursor-pointer border-0 hover:bg-primary-hover transition-colors"
              onClick={() => setShowShortcutsModal(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

