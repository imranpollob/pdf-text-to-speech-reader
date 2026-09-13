export type TtsEngine = 'browser' | 'kokoro';

export interface TextSegment {
  id: string;          // UUID
  text: string;        // The actual sentence text
  pageNumber: number;
  // Bounding box for highlighting (optional, if using canvas drawing)
  rect?: { x: number; y: number; w: number; h: number };
  // IDs of the specific span elements in the PDF.js text layer
  spanIds: string[];
  // Fine-grained fragments per span so we can split multiple sentences inside one span
  spanFragments?: { spanId: string; text: string }[];
  // Formatting metadata for text reader mode
  paragraphIndex?: number;
  trailingNewlines?: number;
}

export interface AudioState {
  segments: TextSegment[];
  currentSegmentIndex: number;
  playbackStatus: 'idle' | 'loading' | 'playing' | 'paused';
  selectedVoice: string | null; // For browser TTS
  file: File | null;
  documentTitle: string | null;

  // Universal playback rate (0.75x to 2x)
  playbackSpeed: number;

  // Reading settings
  autoScroll: boolean;
  currentPage: number;
  totalPages: number;
  isFitToWidth: boolean;

  // TTS engine
  ttsEngine: TtsEngine;
  kokoroVoice: string;
  kokoroSpeed: number;
  kokoroServerUrl: string;

  // PDF zoom state
  scale: number;
  setScale: (scale: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  setIsFitToWidth: (fit: boolean) => void;

  // Text reader font size state
  textFontSize: number;
  setTextFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;

  // Actions
  setFile: (file: File | null) => void;
  setDocumentTitle: (title: string | null) => void;
  setPlaybackSpeed: (speed: number) => void;
  setAutoScroll: (enabled: boolean) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setTtsEngine: (engine: TtsEngine) => void;
  setKokoroVoice: (voice: string) => void;
  setKokoroSpeed: (speed: number) => void;
  setKokoroServerUrl: (url: string) => void;
  setSelectedVoice: (voiceURI: string) => void;
  loadSegments: (segments: TextSegment[]) => void;
  updateSegmentsWithoutReset: (segments: TextSegment[]) => void;
  playSegment: (index: number) => Promise<void>;
  prefetchSegment: (index: number) => Promise<void>;

  // Controls
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  next: () => void;
  setPlaybackStatus: (status: 'idle' | 'loading' | 'playing' | 'paused') => void;
}

