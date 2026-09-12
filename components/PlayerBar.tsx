'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAudioStore } from '../store/use-audio-store';
import { cn } from '../lib/cn';
import { VoiceSheet } from './VoiceSheet';
import { SpeedMenu } from './SpeedMenu';
import {
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon,
  StopIcon,
  HeadphonesIcon,
  SpeedIcon,
  AutoScrollIcon,
  ChevronUpIcon,
} from './Icons';

export const PlayerBar: React.FC = () => {
  const playbackStatus = useAudioStore((s) => s.playbackStatus);
  const play = useAudioStore((s) => s.play);
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);
  const stop = useAudioStore((s) => s.stop);
  const next = useAudioStore((s) => s.next);
  const prev = useAudioStore((s) => s.playSegment);
  const currentSegmentIndex = useAudioStore((s) => s.currentSegmentIndex);
  const segments = useAudioStore((s) => s.segments);
  const selectedVoice = useAudioStore((s) => s.selectedVoice);
  const ttsEngine = useAudioStore((s) => s.ttsEngine);
  const kokoroVoice = useAudioStore((s) => s.kokoroVoice);
  const playbackSpeed = useAudioStore((s) => s.playbackSpeed);
  const autoScroll = useAudioStore((s) => s.autoScroll);
  const setAutoScroll = useAudioStore((s) => s.setAutoScroll);
  const hydrate = useAudioStore((s) => s.hydrate);

  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const voiceTriggerRef = useRef<HTMLButtonElement>(null);
  const speedTriggerRef = useRef<HTMLButtonElement>(null);
  const scrubberTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (playbackStatus === 'playing') pause();
        else if (playbackStatus === 'paused') resume();
        else if (segments.length > 0) play();
      } else if (e.code === 'ArrowRight' && segments.length > 0) {
        e.preventDefault();
        next();
      } else if (e.code === 'ArrowLeft' && segments.length > 0) {
        e.preventDefault();
        prev(Math.max(0, currentSegmentIndex - 1));
      } else if (e.code === 'Escape') {
        setIsVoiceOpen(false);
        setIsSpeedOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackStatus, segments.length, currentSegmentIndex, play, pause, resume, next, prev]);

  // Estimated reading time remaining (150 words/min average speech rate adjusted for speed)
  const remainingEstimate = useMemo(() => {
    if (!segments.length) return null;
    const remainingSegments = segments.slice(currentSegmentIndex);
    const totalRemainingWords = remainingSegments.reduce(
      (acc, seg) => acc + seg.text.trim().split(/\s+/).length,
      0
    );
    const wordsPerMinute = 150 * playbackSpeed;
    const minutes = Math.max(1, Math.ceil(totalRemainingWords / wordsPerMinute));
    return `${minutes} min left`;
  }, [segments, currentSegmentIndex, playbackSpeed]);

  const currentSegment = segments[currentSegmentIndex];
  const progressPercent = segments.length > 0 ? ((currentSegmentIndex + 1) / segments.length) * 100 : 0;

  // Scrubber click/drag interaction
  const handleScrubberChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberTrackRef.current || segments.length === 0) return;
    const rect = scrubberTrackRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = clickX / rect.width;
    const targetIndex = Math.min(
      segments.length - 1,
      Math.max(0, Math.floor(percentage * segments.length))
    );
    prev(targetIndex);
  };

  const handleScrollToCurrentSentence = () => {
    // Scroll active sentence into view
    const currentElements = document.querySelectorAll(`.nr-s${currentSegmentIndex}`);
    if (currentElements.length > 0) {
      (currentElements[0] as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    } else {
      const el = document.getElementById(`text-seg-${currentSegmentIndex}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  if (segments.length === 0) return null;

  // Active voice display name
  const voiceDisplayName =
    ttsEngine === 'kokoro'
      ? kokoroVoice || 'Kokoro HD'
      : selectedVoice
      ? selectedVoice.replace(/^Microsoft /, '').replace(/ Online \(Natural\)/, '').slice(0, 16)
      : 'System Voice';

  return (
    <nav
      aria-label="Audio playback controls"
      className={cn(
        'fixed z-[1000] transition-all duration-300 animate-slide-up',
        'bottom-0 left-0 right-0 w-full',
        'p-2 sm:p-3 md:pb-4 flex justify-center pointer-events-none'
      )}
    >
      <div
        className={cn(
          'pointer-events-auto w-full max-w-4xl mx-auto',
          'bg-navbar/95 backdrop-blur-xl border border-navbar-border shadow-2xl',
          'rounded-2xl md:rounded-3xl p-3 sm:p-3.5 flex flex-col gap-2',
          'transition-all duration-200'
        )}
      >
        {/* Row 1: Interactive Progress Scrubber & Time Remaining */}
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-muted">
            <span className="flex items-center gap-1.5 text-foreground/85">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>
                Sentence {currentSegmentIndex + 1} of {segments.length}
              </span>
            </span>
            <span>
              {remainingEstimate} • {playbackSpeed}x
            </span>
          </div>

          <div
            ref={scrubberTrackRef}
            className="group relative h-4 flex items-center cursor-pointer select-none py-1"
            onClick={handleScrubberChange}
            onMouseDown={() => setIsScrubbing(true)}
            onMouseUp={() => setIsScrubbing(false)}
            role="slider"
            aria-label="Reading progress scrubber"
            aria-valuenow={currentSegmentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={segments.length}
            tabIndex={0}
          >
            {/* Background track */}
            <div className="w-full h-1.5 rounded-full bg-navbar-control border border-navbar-control-border overflow-hidden group-hover:h-2 transition-all duration-150">
              {/* Active fill */}
              <div
                className="h-full bg-primary transition-all duration-150 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Thumb */}
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white shadow-md transition-transform duration-100 group-hover:scale-125',
                isScrubbing && 'scale-125'
              )}
              style={{ left: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Row 2: Active Sentence Live Preview */}
        {currentSegment && (
          <div
            onClick={handleScrollToCurrentSentence}
            className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-navbar-control/60 hover:bg-navbar-control transition-colors cursor-pointer border border-navbar-control-border/60 group"
            title="Click to locate and center active sentence"
          >
            <p className="text-xs text-foreground/80 group-hover:text-foreground truncate font-medium flex-1">
              &ldquo;{currentSegment.text}&rdquo;
            </p>
            <span className="text-[10px] text-primary flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 font-semibold uppercase tracking-wider">
              <span>Locate</span>
              <ChevronUpIcon size={12} />
            </span>
          </div>
        )}

        {/* Row 3: Controls Bar */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 pt-1">
          {/* Left tools: Follow Audio & Voice Picker */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Auto-scroll Lock Toggle */}
            <button
              type="button"
              className={cn(
                'h-9 px-2.5 sm:px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all duration-150',
                autoScroll
                  ? 'bg-primary-subtle border-primary text-primary shadow-xs'
                  : 'bg-navbar-control border-navbar-control-border text-muted hover:text-foreground'
              )}
              title={
                autoScroll
                  ? 'Auto-follow is ON: Page scrolls with voice (Click to turn off)'
                  : 'Auto-follow is OFF: Free scrolling (Click to turn on)'
              }
              aria-label="Toggle auto scroll"
              onClick={() => setAutoScroll(!autoScroll)}
            >
              <AutoScrollIcon size={15} />
              <span className="hidden sm:inline">{autoScroll ? 'Following' : 'Scroll Free'}</span>
            </button>

            {/* Voice Sheet Trigger */}
            <div className="relative">
              <button
                ref={voiceTriggerRef}
                type="button"
                className="h-9 px-2.5 sm:px-3 rounded-xl bg-navbar-control border border-navbar-control-border text-foreground hover:border-primary hover:text-primary flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all duration-150 max-w-[130px] sm:max-w-[180px]"
                title="Select Voice"
                aria-expanded={isVoiceOpen}
                onClick={() => setIsVoiceOpen(!isVoiceOpen)}
              >
                <HeadphonesIcon size={15} className="text-primary shrink-0" />
                <span className="truncate">{voiceDisplayName}</span>
              </button>

              <VoiceSheet
                isOpen={isVoiceOpen}
                onClose={() => setIsVoiceOpen(false)}
                triggerRef={voiceTriggerRef}
              />
            </div>
          </div>

          {/* Center transport buttons: Prev, Big Play/Pause, Next, Stop */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-navbar-control border border-navbar-control-border text-foreground hover:bg-navbar-control-hover hover:text-primary hover:border-primary transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              title="Previous sentence (Left Arrow)"
              aria-label="Previous sentence"
              onClick={() => prev(Math.max(0, currentSegmentIndex - 1))}
            >
              <SkipBackIcon size={17} />
            </button>

            {/* Main Play / Pause Button */}
            <button
              type="button"
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center bg-primary text-white border-0 shadow-lg cursor-pointer transition-all duration-150 hover:bg-primary-hover hover:scale-105 active:scale-95 disabled:opacity-40',
                playbackStatus === 'playing' && 'animate-play-pulse'
              )}
              title={playbackStatus === 'playing' ? 'Pause (Space)' : 'Play (Space)'}
              aria-label={playbackStatus === 'playing' ? 'Pause playback' : 'Play document'}
              disabled={playbackStatus === 'loading'}
              onClick={() => {
                if (playbackStatus === 'playing') pause();
                else if (playbackStatus === 'paused') resume();
                else play();
              }}
            >
              {playbackStatus === 'loading' ? (
                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : playbackStatus === 'playing' ? (
                <PauseIcon size={20} />
              ) : (
                <PlayIcon size={20} className="ml-0.5" />
              )}
            </button>

            <button
              type="button"
              className="w-10 h-10 rounded-full flex items-center justify-center bg-navbar-control border border-navbar-control-border text-foreground hover:bg-navbar-control-hover hover:text-primary hover:border-primary transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              title="Next sentence (Right Arrow)"
              aria-label="Next sentence"
              onClick={() => next()}
            >
              <SkipForwardIcon size={17} />
            </button>

            {(playbackStatus === 'playing' || playbackStatus === 'paused') && (
              <button
                type="button"
                className="w-9 h-9 rounded-full hidden sm:flex items-center justify-center bg-navbar-control border border-navbar-control-border text-error hover:bg-error/10 hover:border-error transition-all active:scale-95 cursor-pointer"
                title="Stop playback and reset to start"
                aria-label="Stop playback"
                onClick={stop}
              >
                <StopIcon size={14} />
              </button>
            )}
          </div>

          {/* Right tools: Speed Picker */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button
                ref={speedTriggerRef}
                type="button"
                className="h-9 px-2.5 sm:px-3 rounded-xl bg-navbar-control border border-navbar-control-border text-foreground hover:border-primary hover:text-primary flex items-center gap-1 text-xs font-semibold font-mono cursor-pointer transition-all duration-150"
                title="Playback Speed"
                aria-expanded={isSpeedOpen}
                onClick={() => setIsSpeedOpen(!isSpeedOpen)}
              >
                <SpeedIcon size={15} className="text-primary hidden sm:inline" />
                <span>{playbackSpeed}x</span>
              </button>

              <SpeedMenu
                isOpen={isSpeedOpen}
                onClose={() => setIsSpeedOpen(false)}
                triggerRef={speedTriggerRef}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

