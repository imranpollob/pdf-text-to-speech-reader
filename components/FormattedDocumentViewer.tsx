'use client';

import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useAudioStore } from '../store/use-audio-store';
import type { TextSegment } from '../types';

interface FormattedDocumentViewerProps {
  html: string;
  segments: TextSegment[];
}

interface TextPosition {
  node: Text;
  offset: number;
}

const BLOCK_SELECTOR = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,td,th';

function buildHighlightMap(root: HTMLElement, segments: TextSegment[]) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const characters: string[] = [];
  const positions: (TextPosition | null)[] = [];
  let node = walker.nextNode() as Text | null;
  let previousBlock: Element | null = null;

  while (node) {
    const block = node.parentElement?.closest(BLOCK_SELECTOR) ?? null;
    if (previousBlock && block !== previousBlock && characters.length > 0 && characters[characters.length - 1] !== ' ') {
      characters.push(' ');
      positions.push(null);
    }
    previousBlock = block;
    for (let offset = 0; offset < node.data.length; offset++) {
      const character = node.data[offset];
      if (/\s/.test(character)) {
        if (characters.length > 0 && characters[characters.length - 1] !== ' ') {
          characters.push(' ');
          positions.push({ node, offset });
        }
      } else {
        characters.push(character);
        positions.push({ node, offset });
      }
    }
    node = walker.nextNode() as Text | null;
  }

  const content = characters.join('');
  const ranges: { start: TextPosition; end: TextPosition; index: number }[] = [];
  let searchFrom = 0;

  segments.forEach((segment, index) => {
    const phrase = segment.text.replace(/\s+/g, ' ').trim();
    const startOffset = content.indexOf(phrase, searchFrom);
    if (!phrase || startOffset < 0) return;

    const start = positions[startOffset];
    const end = positions[startOffset + phrase.length - 1];
    if (start && end) {
      ranges.push({ start, end, index });
      searchFrom = startOffset + phrase.length;
    }
  });

  return ranges;
}

export const FormattedDocumentViewer = ({ html, segments }: FormattedDocumentViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSegmentIndex = useAudioStore((state) => state.currentSegmentIndex);
  const playbackStatus = useAudioStore((state) => state.playbackStatus);
  const autoScroll = useAudioStore((state) => state.autoScroll);
  const playSegment = useAudioStore((state) => state.playSegment);
  const textFontSize = useAudioStore((state) => state.textFontSize);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    container.querySelectorAll('a').forEach((link) => {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    const ranges = buildHighlightMap(container, segments);
    ranges.reverse().forEach(({ start, end, index }) => {
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      range.setEnd(end.node, end.offset + 1);
      const sentence = document.createElement('span');
      sentence.className = `document-segment document-seg-${index}`;
      sentence.id = `document-seg-${index}`;
      sentence.dataset.segmentIndex = String(index);
      sentence.setAttribute('role', 'button');
      sentence.setAttribute('tabindex', '0');
      sentence.setAttribute('title', 'Click to read aloud from here');
      sentence.appendChild(range.extractContents());
      range.insertNode(sentence);
    });

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const sentence = target.closest<HTMLElement>('[data-segment-index]');
      if (sentence) playSegment(Number(sentence.dataset.segmentIndex));
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target as HTMLElement;
      const sentence = target.closest<HTMLElement>('[data-segment-index]');
      if (sentence) {
        event.preventDefault();
        playSegment(Number(sentence.dataset.segmentIndex));
      }
    };

    container.addEventListener('click', handleClick);
    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('click', handleClick);
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [html, segments, playSegment]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll('.document-segment.playing').forEach((element) => {
      element.classList.remove('playing');
    });
    if (playbackStatus === 'idle') return;

    const current = container.querySelector(`#document-seg-${currentSegmentIndex}`);
    current?.classList.add('playing');
    if (autoScroll) current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentSegmentIndex, playbackStatus, autoScroll, html, segments]);

  return (
    <article
      ref={containerRef}
      className="formatted-document w-full mx-auto bg-surface border border-border rounded-2xl md:rounded-3xl p-6 sm:p-10 md:p-12 text-foreground shadow-md"
      style={{ fontSize: `${textFontSize}px` }}
      aria-label="Formatted document reader content"
    />
  );
};
