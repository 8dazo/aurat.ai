import { create } from 'zustand';
import { Clip, TimelineState, ZoomEffect } from '../lib/types';

interface TimelineActions {
    addClip: (clip: Clip) => void;
    removeClip: (id: string) => void;
    updateClip: (id: string, updates: Partial<Clip>) => void;
    setClips: (clips: Clip[]) => void;
    setCurrentTime: (time: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setSelectedClipId: (id: string | null) => void;
    setDuration: (duration: number) => void;
    addZoomEffect: (effect: ZoomEffect) => void;
    removeZoomEffect: (id: string) => void;
    updateZoomEffect: (id: string, updates: Partial<ZoomEffect>) => void;
    setSelectedZoomEffectId: (id: string | null) => void;
}


export const useTimelineStore = create<TimelineState & TimelineActions>((set) => ({
    clips: [],
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    selectedClipId: null,
    zoomEffects: [],
    selectedZoomEffectId: null,


    addClip: (clip) =>
        set((state) => ({
            clips: [...state.clips, clip].sort((a, b) => a.start - b.start),
        })),

    removeClip: (id) =>
        set((state) => ({
            clips: state.clips.filter((c) => c.id !== id),
        })),

    updateClip: (id, updates) =>
        set((state) => ({
            clips: state.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

    setClips: (clips) => set({ clips }),

    setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
    setDuration: (duration) => set({ duration }),

    addZoomEffect: (effect) =>
        set((state) => ({
            zoomEffects: [...state.zoomEffects, effect].sort((a, b) => a.start - b.start),
        })),

    removeZoomEffect: (id) =>
        set((state) => ({
            zoomEffects: state.zoomEffects.filter((e) => e.id !== id),
        })),

    updateZoomEffect: (id, updates) =>
        set((state) => ({
            zoomEffects: state.zoomEffects.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),

    setSelectedZoomEffectId: (selectedZoomEffectId) => set({ selectedZoomEffectId }),
}));

