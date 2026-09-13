'use client';

import React from 'react';
import { useAudioStore } from '../store/use-audio-store';
import { ChevronLeftIcon, ChevronRightIcon, FileTextIcon } from './Icons';

export const PageNavigator: React.FC = () => {
  const file = useAudioStore((s) => s.file);
  const currentPage = useAudioStore((s) => s.currentPage);
  const totalPages = useAudioStore((s) => s.totalPages);
  const setCurrentPage = useAudioStore((s) => s.setCurrentPage);

  if (!file || totalPages <= 1) return null;

  const handlePageJump = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const pageEl = document.getElementById(`pdf-page-${page}`);
    if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className="fixed bottom-24 sm:bottom-28 left-4 z-[900] pointer-events-auto animate-fade-in"
      role="navigation"
      aria-label="PDF page navigation"
    >
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-navbar/95 backdrop-blur-md border border-navbar-border shadow-md text-xs font-semibold text-foreground">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => handlePageJump(currentPage - 1)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-navbar-control transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-0 bg-transparent cursor-pointer"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeftIcon size={14} />
        </button>

        <div className="flex items-center gap-1 px-1 font-mono">
          <FileTextIcon size={13} className="text-primary" />
          <span>
            {currentPage} / {totalPages}
          </span>
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageJump(currentPage + 1)}
          className="w-6 h-6 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-navbar-control transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-0 bg-transparent cursor-pointer"
          title="Next Page"
          aria-label="Next Page"
        >
          <ChevronRightIcon size={14} />
        </button>
      </div>
    </div>
  );
};

