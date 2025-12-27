import { create } from 'zustand';
import { Clip, TimelineState, ZoomEffect, Track, ClipType } from '../lib/types';

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

    // Track management
    addTrack: (track: Track) => void;
    removeTrack: (id: string) => void;
    updateTrack: (id: string, updates: Partial<Track>) => void;
    setTracks: (tracks: Track[]) => void;

    // Timeline settings
    setTimelineScale: (scale: number) => void;
    setTimelineHeight: (height: number) => void;
}

const DEFAULT_TRACKS: Track[] = [
    { id: 'video-1', name: 'Video 1', type: 'video', isLocked: false, isVisible: true, height: 64 },
    { id: 'zoom-1', name: 'Zoom Effects', type: 'zoom', isLocked: false, isVisible: true, height: 48 },
];

export const useTimelineStore = create<TimelineState & TimelineActions>((set) => ({
    tracks: DEFAULT_TRACKS,
    clips: [],
    zoomEffects: [],
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    selectedClipId: null,
    selectedZoomEffectId: null,
    timelineScale: 50, // 50px per second
    timelineHeight: 300,

    addClip: (clip) =>
        set((state) => {
            const trackId = clip.trackId || state.tracks.find(t => t.type === clip.type)?.id || state.tracks[0]?.id;
            const updatedClip = { ...clip, trackId };
            return {
                clips: [...state.clips, updatedClip].sort((a, b) => a.start - b.start),
            };
        }),

    removeClip: (id) =>
        set((state) => ({
            clips: state.clips.filter((c) => c.id !== id),
        })),

    updateClip: (id, updates) =>
        set((state) => ({
            clips: state.clips.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

    setClips: (clips) => set({ clips }),

    setCurrentTime: (time) => set((state) => ({
        currentTime: Math.max(0, Math.min(time, state.duration))
    })),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setSelectedClipId: (selectedClipId) => set({ selectedClipId, selectedZoomEffectId: null }),
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

    setSelectedZoomEffectId: (selectedZoomEffectId) => set({ selectedZoomEffectId, selectedClipId: null }),

    addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
    removeTrack: (id) => set((state) => ({
        tracks: state.tracks.filter(t => t.id !== id),
        clips: state.clips.filter(c => c.trackId !== id),
        zoomEffects: state.zoomEffects.filter(e => e.trackId !== id)
    })),
    updateTrack: (id, updates) => set((state) => ({
        tracks: state.tracks.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
    setTracks: (tracks) => set({ tracks }),

    setTimelineScale: (timelineScale) => set({ timelineScale }),
    setTimelineHeight: (timelineHeight) => set({ timelineHeight }),
}));

