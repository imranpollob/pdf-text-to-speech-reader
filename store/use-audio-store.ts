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

  // TTS engine
  ttsEngine: 'browser',
  kokoroVoice: 'af_heart',
  kokoroSpeed: 1.0,
  kokoroServerUrl: KOKORO_DEFAULT_URL,

  // These fields hold client-only persisted values (localStorage). They must
  // start with server-safe defaults above and get filled in here after mount
  // to avoid SSR/client hydration mismatches.
  hydrated: false,
  hydrate: () => {
    if (typeof window === 'undefined' || get().hydrated) return;

    const savedSpeedRaw = localStorage.getItem('playbackSpeed');
    let savedSpeed = 1.0;
    if (savedSpeedRaw) {
      const parsed = parseFloat(savedSpeedRaw);
      if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 3.0) savedSpeed = parsed;
    }

    set({
      hydrated: true,
      selectedVoice: localStorage.getItem('selectedVoice') ?? null,
      playbackSpeed: savedSpeed,
      kokoroSpeed: savedSpeed,
      ttsEngine: (localStorage.getItem('ttsEngine') as TtsEngine) ?? 'browser',
      kokoroVoice: localStorage.getItem('kokoroVoice') ?? 'af_heart',
      kokoroServerUrl: localStorage.getItem('kokoroServerUrl') ?? KOKORO_DEFAULT_URL,
    });
  },

  setFile: (file: File | null) => set({
    file,
    documentTitle: file ? file.name : null,
  }),

  setDocumentTitle: (title: string | null) => set({ documentTitle: title }),

  setPlaybackSpeed: (speed: number) => {
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('playbackSpeed', speed.toString()); } catch {}
    }
    set({ playbackSpeed: speed, kokoroSpeed: speed });
  },

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

    // Transition to loading while preparing audio
    set({ currentSegmentIndex: index, playbackStatus: 'loading' });

    const segment = segments[index];
    const hash = hashString(segment.text);

    if (ttsEngine === 'kokoro') {
      let blob = audioCache.get(hash);

      // Check IndexedDB if not in memory
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

      // Fetch from kokoro backend
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

      // Prefetch next 1-2 sentences for seamless playback
      get().prefetchSegment(index + 1);
      get().prefetchSegment(index + 2);
    }

    // Transition to playing — AudioEngine will play blob if available, else browser TTS
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

    // Check IndexedDB first
    const dbBlob = await idbGet(hash);
    if (dbBlob && dbBlob instanceof Blob) {
      set(state => {
        const newCache = new Map(state.audioCache);
        newCache.set(hash, dbBlob);
        return { audioCache: newCache };
      });
      return;
    }

    // Fire-and-forget fetch from kokoro backend
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

  // PDF zoom state (shared)
  scale: 1.5,
  setScale: (s: number) => set({ scale: s }),
  zoomIn: () => set(state => ({ scale: Math.min(3.5, +(state.scale * 1.2).toFixed(2)) })),
  zoomOut: () => set(state => ({ scale: Math.max(0.5, +(state.scale / 1.2).toFixed(2)) })),
  zoomReset: () => set({ scale: 1.5 }),
}));
