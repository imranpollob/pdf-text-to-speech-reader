'use client';

import React, { useEffect, useRef, useMemo, Fragment } from 'react';
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

  // Group sentences into paragraphs to preserve the original document organization
  const paragraphs = useMemo(() => {
    const list: { paraIndex: number; items: { segment: (typeof segments)[0]; globalIndex: number }[] }[] = [];
    let current: { paraIndex: number; items: { segment: (typeof segments)[0]; globalIndex: number }[] } | null = null;

    segments.forEach((segment, globalIndex) => {
      const pIdx = segment.paragraphIndex ?? 0;
      if (!current || current.paraIndex !== pIdx) {
        current = { paraIndex: pIdx, items: [] };
        list.push(current);
      }
      current.items.push({ segment, globalIndex });
    });

    return list;
  }, [segments]);

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
      <div className="space-y-6">
        {paragraphs.map((para) => (
          <p key={para.paraIndex} className="m-0 leading-relaxed md:leading-[1.9]">
            {para.items.map(({ segment, globalIndex }) => {
              const isPlaying = playbackStatus !== 'idle' && currentSegmentIndex === globalIndex;
              return (
                <Fragment key={segment.id}>
                  <span
                    id={`text-seg-${globalIndex}`}
                    role="button"
                    tabIndex={0}
                    title="Click to read aloud from here"
                    className={cn(
                      'cursor-pointer transition-colors duration-150 rounded px-1 py-0.5',
                      'hover:bg-primary-subtle hover:text-primary',
                      isPlaying
                        ? 'bg-primary/25 text-foreground font-medium'
                        : 'text-foreground/90'
                    )}
                    onClick={() => playSegment(globalIndex)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        playSegment(globalIndex);
                      }
                    }}
                  >
                    {segment.text}
                  </span>
                  {segment.trailingNewlines === 1 ? <br /> : ' '}
                </Fragment>
              );
            })}
          </p>
        ))}
      </div>
    </div>
  );
};


