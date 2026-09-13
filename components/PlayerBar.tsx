'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  SettingsIcon,
  LocateIcon,
  MinimizeIcon,
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const voiceTriggerRef = useRef<HTMLButtonElement>(null);
  const speedTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackStatus, segments.length, currentSegmentIndex, play, pause, resume, next, prev]);

  const handleSettingsMouseEnter = () => {
    if (settingsTimeoutRef.current) {
      clearTimeout(settingsTimeoutRef.current);
      settingsTimeoutRef.current = null;
    }
    setIsSettingsOpen(true);
  };

  const handleSettingsMouseLeave = () => {
    settingsTimeoutRef.current = setTimeout(() => {
      setIsSettingsOpen(false);
    }, 250);
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

  // Minimized Toolbar: Compact floating pill with Play/Pause and Expand trigger
  if (isMinimized) {
    return (
      <nav
        aria-label="Audio playback controls (minimized)"
        className={cn(
          'fixed z-[1000] transition-all duration-300 animate-slide-up',
          'bottom-3 sm:bottom-4 left-0 right-0 w-full',
          'flex justify-center pointer-events-none'
        )}
      >
        <div
          className={cn(
            'pointer-events-auto flex items-center gap-1.5',
            'bg-navbar/95 backdrop-blur-xl border border-navbar-border shadow-2xl',
            'rounded-full p-1.5 pl-1.5 pr-2 transition-all duration-200'
          )}
        >
          {/* Main Play / Pause Button */}
          <button
            type="button"
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center bg-primary text-white border-0 shadow-md cursor-pointer transition-all duration-150 hover:bg-primary-hover hover:scale-105 active:scale-95 disabled:opacity-40',
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
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : playbackStatus === 'playing' ? (
              <PauseIcon size={18} />
            ) : (
              <PlayIcon size={18} className="ml-0.5" />
            )}
          </button>

          {/* Expand Toolbar Button */}
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-navbar-control transition-colors cursor-pointer"
            title="Expand toolbar"
            aria-label="Expand toolbar"
          >
            <ChevronUpIcon size={16} />
          </button>
        </div>
      </nav>
    );
  }

  // Full Minimalistic Toolbar
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
          'pointer-events-auto w-full max-w-2xl mx-auto',
          'bg-navbar/95 backdrop-blur-xl border border-navbar-border shadow-2xl',
          'rounded-2xl sm:rounded-full px-3 py-2 sm:px-4 sm:py-2.5',
          'transition-all duration-200'
        )}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          {/* Left tools: Settings (Following + Locate on hover) & Voice Picker */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Settings Trigger with Hover Popover */}
            <div
              ref={settingsRef}
              className="relative"
              onMouseEnter={handleSettingsMouseEnter}
              onMouseLeave={handleSettingsMouseLeave}
            >
              <button
                type="button"
                className={cn(
                  'h-9 w-9 rounded-xl sm:rounded-full border flex items-center justify-center cursor-pointer transition-all duration-150',
                  isSettingsOpen
                    ? 'bg-navbar-control-hover border-primary text-primary shadow-xs'
                    : 'bg-navbar-control border-navbar-control-border text-muted hover:text-foreground hover:border-primary/50'
                )}
                title="Settings (Following, Locate)"
                aria-label="Playback Settings"
                aria-expanded={isSettingsOpen}
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                <SettingsIcon size={16} />
              </button>

              {/* Settings Hover Menu */}
              {isSettingsOpen && (
                <div
                  className={cn(
                    'absolute bottom-full mb-2 left-0 min-w-[175px]',
                    'bg-navbar/95 backdrop-blur-xl border border-navbar-border shadow-2xl rounded-2xl p-1.5 flex flex-col gap-1',
                    'animate-slide-up z-50'
                  )}
                >
                  {/* Locate active sentence button */}
                  <button
                    type="button"
                    onClick={() => {
                      handleScrollToCurrentSentence();
                      setIsSettingsOpen(false);
                    }}
                    className="w-full h-8 px-2.5 rounded-xl flex items-center gap-2 text-xs font-medium text-foreground hover:bg-primary-subtle hover:text-primary transition-colors cursor-pointer text-left"
                    title="Locate and center active sentence on screen"
                  >
                    <LocateIcon size={14} className="text-primary shrink-0" />
                    <span>Locate sentence</span>
                  </button>

                  {/* Following toggle button */}
                  <button
                    type="button"
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={cn(
                      'w-full h-8 px-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-medium transition-colors cursor-pointer text-left',
                      autoScroll
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-navbar-control'
                    )}
                    title={
                      autoScroll
                        ? 'Auto-follow is ON: Page scrolls with voice (Click to turn off)'
                        : 'Auto-follow is OFF: Free scrolling (Click to turn on)'
                    }
                  >
                    <div className="flex items-center gap-2">
                      <AutoScrollIcon
                        size={14}
                        className={cn('shrink-0', autoScroll ? 'text-primary' : 'text-muted')}
                      />
                      <span>Following</span>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide',
                        autoScroll
                          ? 'bg-primary text-white'
                          : 'bg-navbar-control border border-navbar-control-border text-muted'
                      )}
                    >
                      {autoScroll ? 'ON' : 'OFF'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Voice Sheet Trigger */}
            <div className="relative">
              <button
                ref={voiceTriggerRef}
                type="button"
                className="h-9 px-2.5 sm:px-3 rounded-xl sm:rounded-full bg-navbar-control border border-navbar-control-border text-foreground hover:border-primary hover:text-primary flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all duration-150 max-w-[120px] sm:max-w-[170px]"
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
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-navbar-control border border-navbar-control-border text-foreground hover:bg-navbar-control-hover hover:text-primary hover:border-primary transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              title="Previous sentence (Left Arrow)"
              aria-label="Previous sentence"
              onClick={() => prev(Math.max(0, currentSegmentIndex - 1))}
            >
              <SkipBackIcon size={16} />
            </button>

            {/* Main Play / Pause Button */}
            <button
              type="button"
              className={cn(
                'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-primary text-white border-0 shadow-lg cursor-pointer transition-all duration-150 hover:bg-primary-hover hover:scale-105 active:scale-95 disabled:opacity-40',
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
                <svg className="animate-spin h-5 w-5 sm:h-6 sm:w-6 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : playbackStatus === 'playing' ? (
                <PauseIcon size={19} />
              ) : (
                <PlayIcon size={19} className="ml-0.5" />
              )}
            </button>

            <button
              type="button"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-navbar-control border border-navbar-control-border text-foreground hover:bg-navbar-control-hover hover:text-primary hover:border-primary transition-all active:scale-95 cursor-pointer disabled:opacity-40"
              title="Next sentence (Right Arrow)"
              aria-label="Next sentence"
              onClick={() => next()}
            >
              <SkipForwardIcon size={16} />
            </button>

            {(playbackStatus === 'playing' || playbackStatus === 'paused') && (
              <button
                type="button"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hidden sm:flex items-center justify-center bg-navbar-control border border-navbar-control-border text-error hover:bg-error/10 hover:border-error transition-all active:scale-95 cursor-pointer"
                title="Stop playback and reset to start"
                aria-label="Stop playback"
                onClick={stop}
              >
                <StopIcon size={13} />
              </button>
            )}
          </div>

          {/* Right tools: Speed Picker & Minimize */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="relative">
              <button
                ref={speedTriggerRef}
                type="button"
                className="h-9 px-2.5 sm:px-3 rounded-xl sm:rounded-full bg-navbar-control border border-navbar-control-border text-foreground hover:border-primary hover:text-primary flex items-center gap-1 text-xs font-semibold font-mono cursor-pointer transition-all duration-150"
                title="Playback Speed"
                aria-expanded={isSpeedOpen}
                onClick={() => setIsSpeedOpen(!isSpeedOpen)}
              >
                <SpeedIcon size={14} className="text-primary hidden sm:inline" />
                <span>{playbackSpeed}x</span>
              </button>

              <SpeedMenu
                isOpen={isSpeedOpen}
                onClose={() => setIsSpeedOpen(false)}
                triggerRef={speedTriggerRef}
              />
            </div>

            {/* Minimize / Hide toolbar button */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="h-9 w-9 rounded-xl sm:rounded-full bg-navbar-control border border-navbar-control-border text-muted hover:text-foreground hover:border-primary/50 flex items-center justify-center cursor-pointer transition-all duration-150"
              title="Minimize toolbar"
              aria-label="Minimize toolbar"
            >
              <MinimizeIcon size={15} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
