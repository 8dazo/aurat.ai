import { create } from 'zustand';
import { Clip, TimelineState } from '../lib/types';

interface TimelineActions {
    addClip: (clip: Clip) => void;
    removeClip: (id: string) => void;
    updateClip: (id: string, updates: Partial<Clip>) => void;
    setClips: (clips: Clip[]) => void;
    setCurrentTime: (time: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setSelectedClipId: (id: string | null) => void;
    setDuration: (duration: number) => void;
}

export const useTimelineStore = create<TimelineState & TimelineActions>((set) => ({
    clips: [],
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    selectedClipId: null,

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
}));
