"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useAudioStore } from '../store/use-audio-store';
import { cn } from '../lib/cn';

export default function NavBar() {
  const playbackStatus = useAudioStore(s => s.playbackStatus);
  const play = useAudioStore(s => s.play);
  const pause = useAudioStore(s => s.pause);
  const resume = useAudioStore(s => s.resume);
  const stop = useAudioStore(s => s.stop);
  const next = useAudioStore(s => s.next);
  const prev = useAudioStore(s => s.playSegment);
  const currentSegmentIndex = useAudioStore(s => s.currentSegmentIndex);
  const segments = useAudioStore(s => s.segments);
  const loadSegments = useAudioStore(s => s.loadSegments);
  const selectedVoice = useAudioStore(s => s.selectedVoice);
  const setSelectedVoice = useAudioStore(s => s.setSelectedVoice);
  const file = useAudioStore(s => s.file);
  const setFile = useAudioStore(s => s.setFile);
  const documentTitle = useAudioStore(s => s.documentTitle);
  const playbackSpeed = useAudioStore(s => s.playbackSpeed);
  const setPlaybackSpeed = useAudioStore(s => s.setPlaybackSpeed);
  const scale = useAudioStore(s => s.scale);
  const zoomIn = useAudioStore(s => s.zoomIn);
  const zoomOut = useAudioStore(s => s.zoomOut);
  const zoomReset = useAudioStore(s => s.zoomReset);

  const hasContent = segments.length > 0;

  // TTS engine state
  const ttsEngine = useAudioStore(s => s.ttsEngine);
  const setTtsEngine = useAudioStore(s => s.setTtsEngine);
  const kokoroVoice = useAudioStore(s => s.kokoroVoice);
  const setKokoroVoice = useAudioStore(s => s.setKokoroVoice);
  const kokoroServerUrl = useAudioStore(s => s.kokoroServerUrl);
  const hydrate = useAudioStore(s => s.hydrate);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [kokoroVoices, setKokoroVoices] = useState<string[]>([]);
  const [kokoroLoading, setKokoroLoading] = useState(false);
  const [openVoicePopover, setOpenVoicePopover] = useState(false);
  const [openSpeedMenu, setOpenSpeedMenu] = useState(false);
  const [voiceTab, setVoiceTab] = useState<'browser' | 'kokoro'>(ttsEngine);
  const [voiceSearch, setVoiceSearch] = useState('');
  const popRef = useRef<HTMLDivElement | null>(null);
  const speedRef = useRef<HTMLDivElement | null>(null);
  const voiceBtnRef = useRef<HTMLButtonElement | null>(null);
  const speedBtnRef = useRef<HTMLButtonElement | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const isMounted = React.useSyncExternalStore(
    () => () => { },
    () => true,
    () => false
  );

  // Rehydrate client-only persisted state (speed, voice, tts engine) after mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Load browser voices
  useEffect(() => {
    const load = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      const vs = window.speechSynthesis.getVoices();
      setVoices(vs);
      if (!selectedVoice && vs.length > 0) {
        const en = vs.find(v => v.lang.startsWith('en')) || vs[0];
        if (en) setSelectedVoice(en.voiceURI);
      }
    };
    load();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [selectedVoice, setSelectedVoice]);

  // Fetch kokoro voices whenever the popover opens
  useEffect(() => {
    if (!openVoicePopover) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setKokoroLoading(true);
    });
    fetch(`${kokoroServerUrl}/voices`)
      .then(r => r.json())
      .then(data => {
        if (active) setKokoroVoices(data.voices ?? []);
      })
      .catch(() => {
        if (active) setKokoroVoices([]);
      })
      .finally(() => {
        if (active) setKokoroLoading(false);
      });
    return () => { active = false; };
  }, [openVoicePopover, kokoroServerUrl]);

  // Close popovers on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (openVoicePopover && popRef.current && !popRef.current.contains(target) && !voiceBtnRef.current?.contains(target)) {
        setOpenVoicePopover(false);
      }
      if (openSpeedMenu && speedRef.current && !speedRef.current.contains(target) && !speedBtnRef.current?.contains(target)) {
        setOpenSpeedMenu(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [openVoicePopover, openSpeedMenu]);

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

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (playbackStatus === 'playing') {
          pause();
        } else if (playbackStatus === 'paused') {
          resume();
        } else if (hasContent) {
          play();
        }
      } else if (e.code === 'ArrowRight' && hasContent) {
        e.preventDefault();
        next();
      } else if (e.code === 'ArrowLeft' && hasContent) {
        e.preventDefault();
        prev(Math.max(0, currentSegmentIndex - 1));
      } else if (e.code === 'Escape') {
        setOpenVoicePopover(false);
        setOpenSpeedMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackStatus, hasContent, currentSegmentIndex, play, pause, resume, next, prev]);

  // Voice label display
  const voiceLabel = isMounted ? (() => {
    if (ttsEngine === 'kokoro') {
      return kokoroVoice ? `🤖 ${kokoroVoice}` : '🤖 Kokoro';
    }
    const found = voices.find(v => v.voiceURI === selectedVoice);
    if (found) return `🔊 ${found.name}`;
    return selectedVoice ? `🔊 ${selectedVoice}` : 'Select Voice';
  })() : '';

  const currentZoomPercent = Math.round((scale / 1.5) * 100);

  const controlBtnBase =
    'w-9 h-9 rounded-full inline-flex items-center justify-center bg-navbar-control border border-navbar-control-border text-foreground cursor-pointer transition-all duration-150 enabled:active:translate-y-0 disabled:opacity-35 disabled:cursor-not-allowed';
  const controlBtnHoverPrimary = 'enabled:hover:bg-navbar-control-hover enabled:hover:text-primary enabled:hover:border-primary enabled:hover:-translate-y-px';
  const controlBtnHoverError = 'text-error enabled:hover:border-error enabled:hover:text-error enabled:hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]';
  const toolBtnClass =
    'h-[34px] px-2.5 rounded-token bg-navbar-control border border-navbar-control-border text-foreground text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer transition-all duration-150 hover:bg-navbar-control-hover hover:border-primary';
  const zoomBtnClass = 'h-full w-[30px] p-0 flex items-center justify-center bg-transparent text-foreground cursor-pointer';

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-[1000] bg-navbar border-b border-navbar-border shadow-navbar transition-[background-color,border-color,box-shadow] duration-[250ms] ease-linear max-md:h-[68px]" role="banner">
      <div className="w-full max-w-[1200px] h-full mx-auto flex items-center justify-between gap-3 px-4 max-md:px-2.5">
        {/* Brand / Document identification */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <a
            href="./"
            className="flex items-center gap-2.5 no-underline text-foreground cursor-pointer shrink-0"
            title="PDF Text to Speech Reader"
            onClick={(e) => {
              if (hasContent || file) {
                e.preventDefault();
                setFile(null);
                loadSegments([]);
              }
            }}
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden border-[1.5px] border-primary flex items-center justify-center bg-navbar-control shadow-[0_2px_6px_color-mix(in_srgb,var(--color-primary)_20%,transparent)]">
              <Image
                src="./brand-logo.png"
                alt="Imran Pollob Brand Logo"
                width={28}
                height={28}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="font-heading font-bold text-base tracking-tight text-foreground whitespace-nowrap">
              <span className="max-[560px]:hidden">PDF Text to Speech Reader</span>
              <span className="hidden max-[560px]:inline">PDF TTS Reader</span>
            </span>
          </a>

          {(hasContent || file) && (
            <div
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-navbar-control border border-navbar-control-border max-w-60 animate-fade-in max-md:max-w-[150px]"
              title={documentTitle || 'Document active'}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 bg-primary-subtle text-primary border-0 rounded-full px-2 py-[3px] text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-primary hover:text-white"
                title="Back to file upload / text input"
                onClick={() => {
                  setFile(null);
                  loadSegments([]);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1 text-xs overflow-hidden">
                <span className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-[110px] text-foreground max-md:max-w-[65px]">{documentTitle || (file ? file.name : 'Pasted Text')}</span>
                {hasContent && (
                  <span className="text-muted [font-variant-numeric:tabular-nums] whitespace-nowrap">
                    ({currentSegmentIndex + 1}/{segments.length})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center: Audio Playback Controls */}
        <div className="flex items-center gap-2 justify-center" aria-label="Playback controls">
          <button
            type="button"
            className={cn(controlBtnBase, controlBtnHoverPrimary)}
            title="Previous sentence (Left Arrow)"
            aria-label="Previous sentence"
            disabled={!hasContent}
            onClick={() => prev(Math.max(0, currentSegmentIndex - 1))}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            type="button"
            className={cn(
              'w-11 h-11 rounded-full inline-flex items-center justify-center bg-primary text-white border-0 cursor-pointer shadow-[0_4px_14px_color-mix(in_srgb,var(--color-primary)_35%,transparent)] transition-all duration-180 enabled:hover:bg-primary-hover enabled:hover:scale-[1.04] enabled:hover:shadow-[0_6px_18px_color-mix(in_srgb,var(--color-primary)_50%,transparent)] enabled:active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none',
              playbackStatus === 'playing' && 'animate-play-pulse'
            )}
            title={playbackStatus === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
            aria-label={playbackStatus === 'playing' ? 'Pause playback' : 'Start playback'}
            disabled={!hasContent || playbackStatus === 'loading'}
            onClick={() => {
              if (playbackStatus === 'playing') pause();
              else if (playbackStatus === 'paused') resume();
              else play();
            }}
          >
            {playbackStatus === 'loading' ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : playbackStatus === 'playing' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className={cn(controlBtnBase, controlBtnHoverPrimary)}
            title="Next sentence (Right Arrow)"
            aria-label="Next sentence"
            disabled={!hasContent}
            onClick={() => next()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {hasContent && (playbackStatus === 'playing' || playbackStatus === 'paused') && (
            <button
              type="button"
              className={cn(controlBtnBase, controlBtnHoverError)}
              title="Stop playback"
              aria-label="Stop playback"
              onClick={stop}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="1.5" />
              </svg>
            </button>
          )}
        </div>

        {/* Right side: Speed, Voice, Zoom, Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Speed Selector */}
          <div className="relative" ref={speedRef}>
            <button
              ref={speedBtnRef}
              type="button"
              className={cn(toolBtnClass, 'font-mono font-semibold min-w-12 justify-center')}
              title="Speech playback speed"
              aria-expanded={openSpeedMenu}
              onClick={() => setOpenSpeedMenu(v => !v)}
            >
              <span>{playbackSpeed}x</span>
            </button>

            {openSpeedMenu && (
              <div className="absolute top-[calc(100%+6px)] right-0 bg-navbar-popover border border-navbar-popover-border rounded-token shadow-md p-1 flex flex-col gap-0.5 min-w-[130px] z-[1100] animate-fade-in-fast">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={cn(
                      'px-3 py-1.5 text-left rounded-md bg-transparent border-0 text-sm font-medium text-foreground cursor-pointer transition-colors duration-100 hover:bg-primary-subtle hover:text-primary',
                      playbackSpeed === s && 'bg-primary! text-white! font-semibold'
                    )}
                    onClick={() => {
                      setPlaybackSpeed(s);
                      setOpenSpeedMenu(false);
                    }}
                  >
                    {s}x {s === 1.0 && '(Normal)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Voice Selector Popover */}
          <div className="relative" ref={popRef}>
            <button
              ref={voiceBtnRef}
              type="button"
              className={cn(toolBtnClass, 'max-w-[170px] max-md:max-w-[100px]')}
              title="Select Voice"
              aria-expanded={openVoicePopover}
              onClick={() => {
                setVoiceTab(ttsEngine);
                setVoiceSearch('');
                setOpenVoicePopover(v => !v);
              }}
            >
              <span aria-hidden="true">💬</span>
              <span className="whitespace-nowrap overflow-hidden text-ellipsis text-sm max-md:hidden">{voiceLabel}</span>
            </button>

            {openVoicePopover && (
              <div className="absolute top-[calc(100%+8px)] right-0 bg-navbar-popover border border-navbar-popover-border rounded-token shadow-lg p-3 z-[1200] animate-fade-in-fast w-80 max-w-[calc(100vw-24px)]">
                {/* Tabs */}
                <div className="flex gap-1 bg-navbar-control border border-navbar-control-border p-[3px] rounded-lg mb-2.5">
                  <button
                    type="button"
                    className={cn(
                      'flex-1 px-2 py-1.5 text-xs font-semibold border-0 bg-transparent text-muted rounded-md cursor-pointer transition-all duration-150',
                      voiceTab === 'browser' && 'bg-navbar-popover! text-primary! shadow-sm'
                    )}
                    onClick={() => { setVoiceTab('browser'); setVoiceSearch(''); }}
                  >
                    🔊 Browser Voices
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'flex-1 px-2 py-1.5 text-xs font-semibold border-0 bg-transparent text-muted rounded-md cursor-pointer transition-all duration-150',
                      voiceTab === 'kokoro' && 'bg-navbar-popover! text-primary! shadow-sm'
                    )}
                    onClick={() => { setVoiceTab('kokoro'); setVoiceSearch(''); }}
                  >
                    🤖 Kokoro Neural
                  </button>
                </div>

                {voiceTab === 'browser' ? (
                  <>
                    <input
                      className="w-full px-2.5 py-[7px] text-sm rounded-md border border-navbar-control-border bg-navbar-popover text-foreground outline-none mb-2 transition-colors duration-150 focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-subtle)]"
                      type="text"
                      placeholder="Search system voices…"
                      value={voiceSearch}
                      onChange={e => setVoiceSearch(e.target.value)}
                      autoFocus
                    />
                    <div className="max-h-[220px] overflow-y-auto flex flex-col gap-0.5 [scrollbar-width:thin]">
                      {(() => {
                        const filtered = voices.filter(v =>
                          v.name.toLowerCase().includes(voiceSearch.toLowerCase()) ||
                          v.lang.toLowerCase().includes(voiceSearch.toLowerCase())
                        );
                        if (voices.length === 0) return <div className="py-4 px-2 text-sm text-muted text-center leading-[1.5]">Loading voices…</div>;
                        if (filtered.length === 0) return <div className="py-4 px-2 text-sm text-muted text-center leading-[1.5]">No voices matching &ldquo;{voiceSearch}&rdquo;</div>;
                        return filtered.map(v => (
                          <div
                            key={v.voiceURI}
                            className={cn(
                              'flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors duration-100 hover:bg-primary-subtle',
                              ttsEngine === 'browser' && selectedVoice === v.voiceURI && 'bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]! font-semibold text-primary!'
                            )}
                            onClick={() => {
                              setSelectedVoice(v.voiceURI);
                              setTtsEngine('browser');
                              setOpenVoicePopover(false);
                            }}
                          >
                            <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[210px]">{v.name}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-border text-muted">{v.lang}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </>
                ) : (
                  <>
                    {!kokoroLoading && kokoroVoices.length > 0 && (
                      <input
                        className="w-full px-2.5 py-[7px] text-sm rounded-md border border-navbar-control-border bg-navbar-popover text-foreground outline-none mb-2 transition-colors duration-150 focus:border-primary focus:shadow-[0_0_0_2px_var(--color-primary-subtle)]"
                        type="text"
                        placeholder="Search Kokoro voices…"
                        value={voiceSearch}
                        onChange={e => setVoiceSearch(e.target.value)}
                        autoFocus
                      />
                    )}
                    <div className="max-h-[220px] overflow-y-auto flex flex-col gap-0.5 [scrollbar-width:thin]">
                      {kokoroLoading ? (
                        <div className="py-4 px-2 text-sm text-muted text-center leading-[1.5]">Connecting to Kokoro server…</div>
                      ) : kokoroVoices.length === 0 ? (
                        <div className="py-4 px-2 text-sm text-muted text-center leading-[1.5]">
                          Kokoro neural server is not active.<br />
                          <span className="text-xs text-muted mt-1 block">
                            Start locally: <code>uv run python main.py</code><br />
                            Browser voices work out of the box!
                          </span>
                        </div>
                      ) : (() => {
                        const filtered = kokoroVoices.filter(v =>
                          v.toLowerCase().includes(voiceSearch.toLowerCase())
                        );
                        if (filtered.length === 0) return <div className="py-4 px-2 text-sm text-muted text-center leading-[1.5]">No voices matching &ldquo;{voiceSearch}&rdquo;</div>;
                        return filtered.map(v => (
                          <div
                            key={v}
                            className={cn(
                              'flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors duration-100 hover:bg-primary-subtle',
                              ttsEngine === 'kokoro' && kokoroVoice === v && 'bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]! font-semibold text-primary!'
                            )}
                            onClick={() => {
                              setKokoroVoice(v);
                              setTtsEngine('kokoro');
                              setOpenVoicePopover(false);
                            }}
                          >
                            <span className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[210px]">{v}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-border text-muted">neural</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Zoom controls (visible if PDF is loaded) */}
          {file && (
            <div className="inline-flex items-center bg-navbar-control border border-navbar-control-border rounded-token overflow-hidden h-[34px] max-[480px]:hidden" role="group" aria-label="Zoom controls">
              <button
                type="button"
                className={zoomBtnClass}
                title="Zoom out"
                onClick={zoomOut}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>

              <button
                type="button"
                className="border-0 bg-transparent px-2 font-mono text-xs font-semibold text-foreground cursor-pointer h-full border-l border-r border-navbar-control-border transition-colors duration-150 hover:text-primary"
                title="Reset zoom to 100%"
                onClick={zoomReset}
              >
                {currentZoomPercent}%
              </button>

              <button
                type="button"
                className={zoomBtnClass}
                title="Zoom in"
                onClick={zoomIn}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          )}

          {/* Signature Imran Pollob Brand Theme Switch Toggle */}
          <button
            className="theme-switch relative w-[54px] h-7 rounded-full border border-navbar-control-border bg-navbar-control cursor-pointer shrink-0 p-0 transition-colors duration-200"
            id="themeSwitch"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            type="button"
            onClick={toggleTheme}
          >
            <svg className="absolute top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-muted left-[7px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <svg className="absolute top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-muted right-[7px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <span className="thumb absolute top-0.5 left-0.5 w-[22px] h-[22px] rounded-full bg-primary text-white flex items-center justify-center transition-[left] duration-200 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)]">
              <svg className="sun-icon w-[13px] h-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
              <svg className="moon-icon w-[13px] h-[13px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
