'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/use-audio-store';
import { cn } from '../lib/cn';

export const TextViewer = () => {
  const segments = useAudioStore(state => state.segments);
  const currentSegmentIndex = useAudioStore(state => state.currentSegmentIndex);
  const playbackStatus = useAudioStore(state => state.playbackStatus);
  const playSegment = useAudioStore(state => state.playSegment);
  const containerRef = useRef<HTMLDivElement>(null);

  // Line-tracking: Auto-scroll to current sentence during playback
  useEffect(() => {
    if (playbackStatus === 'idle') return;
    const el = document.getElementById(`text-seg-${currentSegmentIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentSegmentIndex, playbackStatus]);

  if (!segments.length) return null;

  return (
    <div
      ref={containerRef}
      className="bg-surface border border-border rounded-[calc(var(--radius)*1.2)] p-[clamp(24px,5vw,40px)] text-lg leading-[1.85] text-foreground shadow-md outline-none"
      tabIndex={0}
      aria-label="Text reader content"
    >
      {segments.map((segment, index) => {
        const isPlaying = playbackStatus !== 'idle' && currentSegmentIndex === index;
        return (
          <span
            key={segment.id}
            id={`text-seg-${index}`}
            role="button"
            tabIndex={0}
            title="Click to read from here"
            className={cn(
              'inline cursor-pointer rounded mx-px px-1 py-0.5 transition-[background-color,box-shadow] duration-150 ease-linear hover:bg-highlight-hover hover:text-highlight-text',
              isPlaying && 'bg-highlight-hover! text-highlight-text! shadow-[0_0_0_2px_var(--highlight-border)] font-medium'
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
  );
};
