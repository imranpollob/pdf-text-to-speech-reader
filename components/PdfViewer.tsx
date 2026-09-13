'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { TextLayerBuilder } from 'pdfjs-dist/web/pdf_viewer.mjs';
import 'pdfjs-dist/web/pdf_viewer.css';
import { normalizeText } from '../lib/text-normalizer';
import { useAudioStore } from '../store/use-audio-store';
import type { TextSegment } from '../types';

// Set worker src dynamically with support for GitHub Pages subpaths
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
pdfjsLib.GlobalWorkerOptions.workerSrc = `${basePath}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: File | null;
}

export const PdfViewer = ({ file }: PdfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Store state
  const scale = useAudioStore((state) => state.scale);
  const setScale = useAudioStore((state) => state.setScale);
  const isFitToWidth = useAudioStore((state) => state.isFitToWidth);
  const autoScroll = useAudioStore((state) => state.autoScroll);
  const setTotalPages = useAudioStore((state) => state.setTotalPages);
  const setCurrentPage = useAudioStore((state) => state.setCurrentPage);

  // Store actions
  const loadSegments = useAudioStore((state) => state.loadSegments);
  const updateSegmentsWithoutReset = useAudioStore((state) => state.updateSegmentsWithoutReset);
  const playSegment = useAudioStore((state) => state.playSegment);
  const storeSegments = useAudioStore((state) => state.segments);
  const currentSegmentIndex = useAudioStore((state) => state.currentSegmentIndex);
  const playbackStatus = useAudioStore((state) => state.playbackStatus);

  // Fit to width calculator
  const calculateFitScale = useCallback(
    async (pdf: pdfjsLib.PDFDocumentProxy) => {
      try {
        const firstPage = await pdf.getPage(1);
        const unscaledViewport = firstPage.getViewport({ scale: 1 });
        const availableWidth = containerRef.current?.clientWidth || window.innerWidth - 32;
        const targetScale = Math.max(0.6, Math.min(2.5, (availableWidth - 24) / unscaledViewport.width));
        return parseFloat(targetScale.toFixed(2));
      } catch {
        return 1.2;
      }
    },
    []
  );

  // Load PDF document
  useEffect(() => {
    if (!file) return;

    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);

        // Auto-fit on mobile screens on initial load
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          const fitScale = await calculateFitScale(pdf);
          setScale(fitScale);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();

    const currentContainer = containerRef.current;
    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
    };
  }, [file, setTotalPages, calculateFitScale, setScale]);

  // React to Fit-to-Width toggle
  useEffect(() => {
    if (isFitToWidth && pdfDocument) {
      calculateFitScale(pdfDocument).then((newScale) => {
        setScale(newScale);
      });
    }
  }, [isFitToWidth, pdfDocument, calculateFitScale, setScale]);

  // Wrap sentence fragments inside presentation spans
  const tagSentencesInTextLayer = (
    textDivs: HTMLElement[],
    textItems: unknown[],
    segments: TextSegment[],
    pageNumber: number,
    segmentOffset: number
  ) => {
    const spanToFragments = new Map<string, { index: number; text: string }[]>();
    segments.forEach((segment, idx) => {
      const segmentIndex = segmentOffset + idx;
      const fragments = segment.spanFragments ?? [];
      fragments.forEach((fragment) => {
        const bucket = spanToFragments.get(fragment.spanId) ?? [];
        bucket.push({ index: segmentIndex, text: fragment.text });
        spanToFragments.set(fragment.spanId, bucket);
      });
    });

    let itemPtr = 0;
    textDivs.forEach((span) => {
      while (
        itemPtr < textItems.length &&
        (((textItems[itemPtr] as { str?: string } | null)?.str?.length ?? 0) === 0)
      ) {
        itemPtr++;
      }

      if (itemPtr < textItems.length) {
        const spanId = `page-${pageNumber}-span-${itemPtr}`;
        span.id = spanId;
        span.classList.add('segment-span');

        const fragments = spanToFragments.get(spanId);
        if (fragments && fragments.length > 0) {
          span.textContent = '';
          fragments.forEach((fragment) => {
            if (fragment.text.trim().length === 0) {
              span.appendChild(document.createTextNode(fragment.text));
              return;
            }

            const sentenceWrapper = document.createElement('nr-sentence');
            sentenceWrapper.className = `nr-sentence nr-s${fragment.index}`;
            sentenceWrapper.setAttribute('data-na-sen-ind', fragment.index.toString());
            sentenceWrapper.setAttribute('data-na-page-ind', pageNumber.toString());
            sentenceWrapper.textContent = fragment.text;

            span.appendChild(sentenceWrapper);
          });
        }

        itemPtr++;
      }
    });
  };

  // Render all pages
  useEffect(() => {
    if (!pdfDocument || !containerRef.current) return;

    let isCancelled = false;

    const renderAllPages = async () => {
      const container = containerRef.current;
      if (!container) return;

      container.innerHTML = ''; // Clear previous content

      const allSegments: TextSegment[] = [];
      let segmentOffset = 0;
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

      // Setup intersection observer to track active page
      const pageObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const pageNumStr = entry.target.getAttribute('data-page-number');
              if (pageNumStr) {
                setCurrentPage(parseInt(pageNumStr, 10));
              }
            }
          });
        },
        { threshold: 0.3 }
      );

      // Render each page
      for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
        if (isCancelled) return;

        const page = await pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Create page container
        const pageContainer = document.createElement('div');
        pageContainer.id = `pdf-page-${pageNum}`;
        pageContainer.setAttribute('data-page-number', pageNum.toString());
        pageContainer.className =
          'relative mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.1)] bg-white rounded-xl overflow-hidden max-w-full';
        pageContainer.style.width = `${viewport.width}px`;
        pageContainer.style.height = `${viewport.height}px`;

        pageObserver.observe(pageContainer);

        // Create high-DPI crisp canvas
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.className = 'block pointer-events-none';

        const context = canvas.getContext('2d', { alpha: false });
        if (context) {
          context.setTransform(dpr, 0, 0, dpr, 0, 0);
          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;
        }

        if (isCancelled) return;

        pageContainer.appendChild(canvas);

        // Create text layer
        const textContent = await page.getTextContent();
        const pageSegments = normalizeText(textContent.items, pageNum);

        const textLayerDiv = document.createElement('div');
        textLayerDiv.className = 'textLayer pdf-textLayer';
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;

        const textLayer = new TextLayerBuilder({
          pdfPage: page,
        });

        await textLayer.render({ viewport });

        if (isCancelled) return;

        if (textLayer.div) {
          const spans = Array.from(
            textLayer.div.querySelectorAll<HTMLElement>('span[role="presentation"]')
          );

          // Convert positioning to exact pixels for zoom accuracy
          spans.forEach((span) => {
            const getBaseValue = (style: string): number | null => {
              if (!style) return null;
              const match = style.match(/\*\s*([\d.]+)px/);
              return match ? parseFloat(match[1]) : null;
            };

            if (span.style.left.includes('calc')) {
              const base = getBaseValue(span.style.left);
              if (base !== null) span.style.left = `${base * viewport.scale}px`;
            } else if (span.style.left.endsWith('%')) {
              const leftPerc = parseFloat(span.style.left);
              span.style.left = `${(leftPerc / 100) * viewport.width}px`;
            }

            if (span.style.top.includes('calc')) {
              const base = getBaseValue(span.style.top);
              if (base !== null) span.style.top = `${base * viewport.scale}px`;
            } else if (span.style.top.endsWith('%')) {
              const topPerc = parseFloat(span.style.top);
              span.style.top = `${(topPerc / 100) * viewport.height}px`;
            }

            const currentFontSize = span.style.fontSize;
            if (currentFontSize && currentFontSize.includes('calc')) {
              const base = getBaseValue(currentFontSize);
              if (base !== null) span.style.fontSize = `${base * viewport.scale}px`;
            }
          });

          tagSentencesInTextLayer(spans, textContent.items, pageSegments, pageNum, segmentOffset);

          textLayer.div.classList.add('pdf-textLayer-inner');

          spans.forEach((s) => {
            s.classList.add('pdf-span');
            s.querySelectorAll('nr-sentence').forEach((nr) => {
              (nr as HTMLElement).classList.add('pdf-nr-sentence');
            });
          });

          while (textLayer.div.firstChild) {
            textLayerDiv.appendChild(textLayer.div.firstChild);
          }

          pageContainer.appendChild(textLayerDiv);
        }

        if (isCancelled) return;
        container.appendChild(pageContainer);

        allSegments.push(...pageSegments);
        segmentOffset += pageSegments.length;
      }

      if (isCancelled) return;

      const currentStoreSegments = useAudioStore.getState().segments;
      if (currentStoreSegments.length > 0 && currentStoreSegments.length === allSegments.length) {
        updateSegmentsWithoutReset(allSegments);
      } else {
        loadSegments(allSegments);
      }
    };

    renderAllPages();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfDocument, scale]);

  // Global event delegation for hover and click
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let hoveredSegmentIndex: string | null = null;

    const setHoveredSegment = (index: string | null) => {
      document.querySelectorAll('nr-sentence.hovered').forEach((el) => el.classList.remove('hovered'));
      if (index === null) {
        hoveredSegmentIndex = null;
        return;
      }
      document.querySelectorAll(`.nr-s${index}`).forEach((el) => el.classList.add('hovered'));
      hoveredSegmentIndex = index;
    };

    const clearHover = () => setHoveredSegment(null);

    const handlePointerOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const sentenceElement = target.closest('nr-sentence');
      if (!sentenceElement) return;

      const segmentIndex = sentenceElement.getAttribute('data-na-sen-ind');
      if (!segmentIndex) return;

      if (segmentIndex !== hoveredSegmentIndex) {
        setHoveredSegment(segmentIndex);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const sentenceElement = target.closest('nr-sentence');
      if (sentenceElement) {
        const segmentIndex = parseInt(sentenceElement.getAttribute('data-na-sen-ind') || '-1', 10);
        if (segmentIndex >= 0) {
          playSegment(segmentIndex);
        }
      }
    };

    document.addEventListener('pointerover', handlePointerOver);
    document.addEventListener('click', handleClick);

    const handlePointerOut = (e: PointerEvent) => {
      if (!container.contains(e.relatedTarget as Node)) {
        clearHover();
      }
    };
    document.addEventListener('pointerout', handlePointerOut);

    return () => {
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('pointerout', handlePointerOut);
    };
  }, [playSegment]);

  // Sync Highlight with Playback & Respect Auto-Scroll Toggle
  useEffect(() => {
    // Clear old highlights
    document.querySelectorAll('nr-sentence.playing').forEach((el) => {
      el.classList.remove('playing');
    });

    if (!storeSegments.length || playbackStatus === 'idle') return;

    if (currentSegmentIndex >= 0 && currentSegmentIndex < storeSegments.length) {
      const currentElements = document.querySelectorAll(`.nr-s${currentSegmentIndex}`);
      currentElements.forEach((el) => el.classList.add('playing'));

      // Smooth line-tracking: ONLY scroll if autoScroll is enabled
      if (autoScroll && currentElements.length > 0) {
        const firstEl = currentElements[0] as HTMLElement;
        firstEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }
  }, [currentSegmentIndex, storeSegments, playbackStatus, autoScroll]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
        <p className="text-sm font-medium text-muted">Rendering PDF pages with high clarity…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full relative">
      <div ref={containerRef} className="flex flex-col items-center w-full max-w-full overflow-x-auto" />
    </div>
  );
};
