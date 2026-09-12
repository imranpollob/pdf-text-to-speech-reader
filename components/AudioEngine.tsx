'use client';

import { useEffect, useRef } from 'react';
import { useAudioStore } from '../store/use-audio-store';

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString();
};

export const AudioEngine = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastHashRef = useRef<string | null>(null);
  const lastUrlRef = useRef<string | null>(null);

  // Subscribe to store state
  const currentSegmentIndex = useAudioStore(state => state.currentSegmentIndex);
  const playbackStatus = useAudioStore(state => state.playbackStatus);
  const segments = useAudioStore(state => state.segments);
  const audioCache = useAudioStore(state => state.audioCache);
  const selectedVoice = useAudioStore(state => state.selectedVoice);
  const playbackSpeed = useAudioStore(state => state.playbackSpeed);
  const next = useAudioStore(state => state.next);

  // Create audio element once
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.onended = () => {
        next();
      };
      audio.onerror = (e) => {
        console.error('Audio playback error', e);
      };
      audioRef.current = audio;
    }
  }, [next]);

  // Main playback effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Adjust playback rate on the active audio element
    audio.playbackRate = playbackSpeed;

    // Stop everything when not in 'playing' state
    if (playbackStatus !== 'playing') {
      try { audio.pause(); } catch { }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      utteranceRef.current = null;
      return;
    }

    // --- Playing ---
    const segment = segments[currentSegmentIndex];
    if (!segment) {
      // Reached the end or no content
      useAudioStore.getState().setPlaybackStatus('idle');
      return;
    }

    const hash = hashString(segment.text);
    const blob = audioCache.get(hash);

    if (blob) {
      // Cancel any browser TTS utterance
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      utteranceRef.current = null;

      // Resume if same segment (hash matches)
      if (lastHashRef.current === hash && lastUrlRef.current) {
        (async () => {
          try {
            audio.playbackRate = playbackSpeed;
            await audio.play();
          } catch (e: unknown) {
            if (e instanceof Error && e.name !== 'AbortError') console.error('Audio play failed', e);
          }
        })();
        return;
      }

      // New segment — clean up old URL
      if (lastUrlRef.current) {
        try { URL.revokeObjectURL(lastUrlRef.current); } catch { }
      }

      const url = URL.createObjectURL(blob);
      lastUrlRef.current = url;
      lastHashRef.current = hash;
      audio.src = url;
      audio.playbackRate = playbackSpeed;

      (async () => {
        try {
          await audio.play();
        } catch (e: unknown) {
          if (e instanceof Error && e.name !== 'AbortError') console.error('Audio play failed', e);
        }
      })();
    } else {
      // Browser Web Speech API fallback
      try { audio.pause(); } catch { }
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(segment.text);
      utterance.rate = playbackSpeed;

      if (selectedVoice) {
        const voices = window.speechSynthesis.getVoices();
        const foundVoice = voices.find(v => v.voiceURI === selectedVoice);
        if (foundVoice) utterance.voice = foundVoice;
      }

      utterance.onend = () => {
        utteranceRef.current = null;
        next();
      };

      utterance.onerror = (e) => {
        // Ignore user-initiated cancellation errors
        if (e.error === 'canceled' || e.error === 'interrupted') {
          return;
        }
        console.warn('Speech synthesis error:', e);
        utteranceRef.current = null;
        next();
      };

      // Hold utterance in ref to protect from Chromium garbage collection
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [currentSegmentIndex, playbackStatus, segments, audioCache, selectedVoice, playbackSpeed, next]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lastUrlRef.current) {
        try { URL.revokeObjectURL(lastUrlRef.current); } catch { }
        lastUrlRef.current = null;
        lastHashRef.current = null;
      }
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch { }
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      utteranceRef.current = null;
    };
  }, []);

  return null; // Headless
};
