'use client';

import React, { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/use-audio-store';
import { cn } from '../lib/cn';
import { SpeedIcon, CheckIcon } from './Icons';

interface SpeedMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export const SpeedMenu: React.FC<SpeedMenuProps> = ({ isOpen, onClose, triggerRef }) => {
  const playbackSpeed = useAudioStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useAudioStore((s) => s.setPlaybackSpeed);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isOpen, onClose, triggerRef]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[1100] md:hidden backdrop-blur-xs animate-fade-in-fast"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Container: Floating popover on desktop, bottom sheet on mobile */}
      <div
        ref={menuRef}
        className={cn(
          'z-[1200] bg-surface border border-border shadow-lg p-2 rounded-2xl flex flex-col gap-1',
          'max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:rounded-b-none max-md:p-4 max-md:safe-bottom max-md:animate-slide-up',
          'md:absolute md:bottom-[calc(100%+10px)] md:right-0 md:min-w-[170px] md:animate-fade-in-fast md:rounded-xl'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Playback speed selector"
      >
        {/* Mobile handle & title */}
        <div className="md:hidden flex flex-col items-center mb-3">
          <div className="w-10 h-1 rounded-full bg-border mb-3" />
          <div className="flex items-center gap-2 text-foreground font-semibold text-base">
            <SpeedIcon size={20} className="text-primary" />
            <span>Playback Speed</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-muted uppercase tracking-wider">
          <SpeedIcon size={14} className="text-primary" />
          <span>Speech Speed</span>
        </div>

        <div className="flex flex-col gap-1">
          {SPEEDS.map((s) => {
            const isSelected = playbackSpeed === s;
            return (
              <button
                key={s}
                type="button"
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 cursor-pointer border-0',
                  isSelected
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'bg-transparent text-foreground hover:bg-primary-subtle hover:text-primary'
                )}
                onClick={() => {
                  setPlaybackSpeed(s);
                  onClose();
                }}
              >
                <span className="font-mono text-base md:text-sm">
                  {s}x {s === 1.0 && <span className="text-xs opacity-80">(Normal)</span>}
                </span>
                {isSelected && <CheckIcon size={16} />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

