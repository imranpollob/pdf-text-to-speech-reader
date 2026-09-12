'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/use-audio-store';
import { cn } from '../lib/cn';

export const TextViewer = () => {
  const segments = useAudioStore((state) => state.segments);
  const currentSegmentIndex = useAudioStore((state) => state.currentSegmentIndex);
  const playbackStatus = useAudioStore((state) => state.playbackStatus);
  const autoScroll = useAudioStore((state) => state.autoScroll);
  const playSegment = useAudioStore((state) => state.playSegment);
  const containerRef = useRef<HTMLDivElement>(null);

  // Line-tracking: Auto-scroll to current sentence during playback ONLY if autoScroll is enabled
  useEffect(() => {
    if (playbackStatus === 'idle' || !autoScroll) return;
    const el = document.getElementById(`text-seg-${currentSegmentIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSegmentIndex, playbackStatus, autoScroll]);

  if (!segments.length) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full max-w-3xl mx-auto bg-surface border border-border rounded-2xl md:rounded-3xl',
        'p-6 sm:p-10 md:p-14 text-base sm:text-lg leading-relaxed md:leading-[1.9] text-foreground shadow-lg',
        'transition-all duration-200 focus:outline-none'
      )}
      tabIndex={0}
      aria-label="Text document reader content"
    >
      <div className="flex flex-wrap gap-y-1">
        {segments.map((segment, index) => {
          const isPlaying = playbackStatus !== 'idle' && currentSegmentIndex === index;
          return (
            <span
              key={segment.id}
              id={`text-seg-${index}`}
              role="button"
              tabIndex={0}
              title="Click to read aloud from here"
              className={cn(
                'inline rounded-md px-1 py-0.5 transition-all duration-150 cursor-pointer',
                'hover:bg-primary-subtle hover:text-primary',
                isPlaying
                  ? 'bg-primary/20 text-foreground font-semibold shadow-[0_0_0_2px_var(--color-primary)] ring-2 ring-primary/20'
                  : 'text-foreground/90'
              )}
              onClick={() => playSegment(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  playSegment(index);
                }
              }}
            >
              {segment.text}{' '}
            </span>
          );
        })}
      </div>
    </div>
  );
};

