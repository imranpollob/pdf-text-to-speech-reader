import { create } from 'zustand';
import { AudioState, TextSegment, TtsEngine } from '../types';
import { get as idbGet, set as idbSet } from 'idb-keyval';

// Simple string hash for caching
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

const KOKORO_DEFAULT_URL = 'http://localhost:8880';

interface AudioStore extends AudioState {
  audioCache: Map<string, Blob>;
  hydrated: boolean;
  hydrate: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  segments: [],
  currentSegmentIndex: 0,
  playbackStatus: 'idle',
  selectedVoice: null,
  audioCache: new Map(),
  file: null,
  documentTitle: null,

  // Speed
  playbackSpeed: 1.0,

  // Reading & navigation state
  autoScroll: true,
  currentPage: 1,
  totalPages: 1,
  isFitToWidth: false,

  // TTS engine
  ttsEngine: 'browser',
  kokoroVoice: 'af_heart',
  kokoroSpeed: 1.0,
  kokoroServerUrl: KOKORO_DEFAULT_URL,

  // Client-only persisted values (localStorage)
  hydrated: false,
  hydrate: () => {
    if (typeof window === 'undefined' || get().hydrated) return;

    const savedSpeedRaw = localStorage.getItem('playbackSpeed');
    let savedSpeed = 1.0;
    if (savedSpeedRaw) {
      const parsed = parseFloat(savedSpeedRaw);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 3.0) savedSpeed = parsed;
    }

    const savedAutoScrollRaw = localStorage.getItem('autoScroll');
    const savedAutoScroll = savedAutoScrollRaw !== null ? savedAutoScrollRaw === 'true' : true;

    const savedFontSizeRaw = localStorage.getItem('textFontSize');
    let savedFontSize = 16;
    if (savedFontSizeRaw) {
      const parsed = parseInt(savedFontSizeRaw, 10);
      if (!isNaN(parsed) && parsed >= 12 && parsed <= 32) savedFontSize = parsed;
    }

    set({
      hydrated: true,
      selectedVoice: localStorage.getItem('selectedVoice') ?? null,
      playbackSpeed: savedSpeed,
      kokoroSpeed: savedSpeed,
      autoScroll: savedAutoScroll,
      textFontSize: savedFontSize,
      ttsEngine: (localStorage.getItem('ttsEngine') as TtsEngine) ?? 'browser',
      kokoroVoice: localStorage.getItem('kokoroVoice') ?? 'af_heart',
      kokoroServerUrl: localStorage.getItem('kokoroServerUrl') ?? KOKORO_DEFAULT_URL,
    });
  },

  setFile: (file: File | null) => set({
    file,
    documentTitle: file ? file.name : null,
    currentPage: 1,
    totalPages: 1,
  }),

  setDocumentTitle: (title: string | null) => set({ documentTitle: title }),

  setPlaybackSpeed: (speed: number) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('playbackSpeed', speed.toString()); } catch {}
    }
    set({ playbackSpeed: speed, kokoroSpeed: speed });
  },

  setAutoScroll: (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('autoScroll', enabled.toString()); } catch {}
    }
    set({ autoScroll: enabled });
  },

  setCurrentPage: (page: number) => set({ currentPage: Math.max(1, page) }),
  setTotalPages: (pages: number) => set({ totalPages: Math.max(1, pages) }),
  setIsFitToWidth: (fit: boolean) => set({ isFitToWidth: fit }),

  setTtsEngine: (engine: TtsEngine) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('ttsEngine', engine); } catch {}
    }
    set({ ttsEngine: engine });
  },

  setKokoroVoice: (voice: string) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('kokoroVoice', voice); } catch {}
    }
    set({ kokoroVoice: voice });
  },

  setKokoroSpeed: (speed: number) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('playbackSpeed', speed.toString()); } catch {}
    }
    set({ kokoroSpeed: speed, playbackSpeed: speed });
  },

  setKokoroServerUrl: (url: string) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('kokoroServerUrl', url); } catch {}
    }
    set({ kokoroServerUrl: url });
  },

  setSelectedVoice: (voiceURI: string) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('selectedVoice', voiceURI); } catch {}
    }
    set({ selectedVoice: voiceURI });
  },

  setPlaybackStatus: (status) => set({ playbackStatus: status }),

  loadSegments: (segments: TextSegment[]) =>
    set({ segments, currentSegmentIndex: 0, playbackStatus: 'idle' }),

  updateSegmentsWithoutReset: (segments: TextSegment[]) =>
    set(state => ({
      segments,
      currentSegmentIndex: Math.min(state.currentSegmentIndex, Math.max(0, segments.length - 1)),
    })),

  playSegment: async (index: number) => {
    const { segments, ttsEngine, audioCache, kokoroVoice, kokoroSpeed, kokoroServerUrl } = get();
    if (index < 0 || index >= segments.length) return;

    set({ currentSegmentIndex: index, playbackStatus: 'loading' });

    const segment = segments[index];
    const hash = hashString(segment.text);

    if (ttsEngine === 'kokoro') {
      let blob = audioCache.get(hash);

      if (!blob) {
        const dbBlob = await idbGet(hash);
        if (dbBlob && dbBlob instanceof Blob) {
          blob = dbBlob;
          set(state => {
            const newCache = new Map(state.audioCache);
            newCache.set(hash, blob!);
            return { audioCache: newCache };
          });
        }
      }

      if (!blob) {
        try {
          const response = await fetch(`${kokoroServerUrl}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: segment.text,
              voice: kokoroVoice,
              speed: kokoroSpeed,
              lang: 'en-us',
            }),
          });

          if (!response.ok) {
            throw new Error(`Kokoro TTS error: ${response.status}`);
          }

          blob = await response.blob();
          await idbSet(hash, blob);

          set(state => {
            const newCache = new Map(state.audioCache);
            newCache.set(hash, blob!);
            return { audioCache: newCache };
          });
        } catch (error) {
          console.error('Kokoro TTS error, falling back to browser TTS:', error);
        }
      }

      get().prefetchSegment(index + 1);
      get().prefetchSegment(index + 2);
    }

    set({ playbackStatus: 'playing' });
  },

  next: () => {
    const { currentSegmentIndex, segments, playSegment } = get();
    if (currentSegmentIndex < segments.length - 1) {
      playSegment(currentSegmentIndex + 1);
    } else {
      set({ playbackStatus: 'idle' });
    }
  },

  play: () => {
    const { currentSegmentIndex, playSegment } = get();
    playSegment(currentSegmentIndex);
  },

  pause: () => {
    set({ playbackStatus: 'paused' });
  },

  resume: () => {
    set({ playbackStatus: 'playing' });
  },

  stop: () => {
    set({ playbackStatus: 'idle', currentSegmentIndex: 0 });
  },

  prefetchSegment: async (index: number) => {
    const { segments, ttsEngine, audioCache, kokoroVoice, kokoroSpeed, kokoroServerUrl } = get();
    if (index < 0 || index >= segments.length) return;
    if (ttsEngine !== 'kokoro') return;

    const segment = segments[index];
    const hash = hashString(segment.text);

    if (audioCache.has(hash)) return;

    const dbBlob = await idbGet(hash);
    if (dbBlob && dbBlob instanceof Blob) {
      set(state => {
        const newCache = new Map(state.audioCache);
        newCache.set(hash, dbBlob);
        return { audioCache: newCache };
      });
      return;
    }

    fetch(`${kokoroServerUrl}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: segment.text,
        voice: kokoroVoice,
        speed: kokoroSpeed,
        lang: 'en-us',
      }),
    })
      .then(async (response) => {
        if (!response.ok) return;
        const blob = await response.blob();
        await idbSet(hash, blob);
        set(state => {
          const newCache = new Map(state.audioCache);
          newCache.set(hash, blob);
          return { audioCache: newCache };
        });
      })
      .catch(e => console.warn('Prefetch failed:', e));
  },

  // PDF zoom state
  scale: 1.5,
  setScale: (s: number) => set({ scale: s, isFitToWidth: false }),
  zoomIn: () => set(state => ({ scale: Math.min(3.5, +(state.scale * 1.2).toFixed(2)), isFitToWidth: false })),
  zoomOut: () => set(state => ({ scale: Math.max(0.5, +(state.scale / 1.2).toFixed(2)), isFitToWidth: false })),
  zoomReset: () => set({ scale: 1.5, isFitToWidth: false }),

  // Text reader font size state (12px to 32px, default 16px)
  textFontSize: 16,
  setTextFontSize: (size: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('textFontSize', size.toString());
    }
    set({ textFontSize: size });
  },
  increaseFontSize: () =>
    set((state) => {
      const next = Math.min(32, state.textFontSize + 2);
      if (typeof window !== 'undefined') {
        localStorage.setItem('textFontSize', next.toString());
      }
      return { textFontSize: next };
    }),
  decreaseFontSize: () =>
    set((state) => {
      const next = Math.max(12, state.textFontSize - 2);
      if (typeof window !== 'undefined') {
        localStorage.setItem('textFontSize', next.toString());
      }
      return { textFontSize: next };
    }),
  resetFontSize: () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('textFontSize', '16');
    }
    set({ textFontSize: 16 });
  },
}));

