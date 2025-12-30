import { create } from 'zustand';
import { Clip, TimelineState, ZoomEffect, Track, ClipType } from '../lib/types';
import { useCaptionStore } from './useCaptionStore';

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
    setMovieDimensions: (dimensions: { width: number; height: number }) => void;

    // Magnetic Timeline Actions
    reorderClips: (trackId: string, startIndex: number, endIndex: number) => void;
    cutClip: (id: string, time: number) => void;
    deleteClip: (id: string) => void;
    trimClip: (id: string, side: 'left' | 'right', delta: number) => void;
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
    movieDimensions: { width: 1280, height: 720 },

    addClip: (clip: Clip) =>
        set((state: TimelineState) => {
            const trackId = clip.trackId || state.tracks.find(t => t.type === clip.type)?.id || state.tracks[0]?.id;

            // Magnetic behavior: if no start time provided or we want to snap to end
            let start = clip.start;
            const trackClips = state.clips.filter(c => c.trackId === trackId).sort((a, b) => a.start - b.start);
            if (trackClips.length > 0) {
                const lastClip = trackClips[trackClips.length - 1];
                start = lastClip.start + lastClip.duration;
            } else {
                start = 0;
            }

            const updatedClip = { ...clip, trackId, start };

            if (clip.type === 'video' || clip.type === 'audio') {
                useCaptionStore.getState().clearCaptions('Added new clip');
            }

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
    setMovieDimensions: (movieDimensions) => set({ movieDimensions }),

    reorderClips: (trackId: string, startIndex: number, endIndex: number) =>
        set((state: TimelineState) => {
            const trackClips = state.clips.filter((c: Clip) => c.trackId === trackId).sort((a: Clip, b: Clip) => a.start - b.start);
            const otherClips = state.clips.filter((c: Clip) => c.trackId !== trackId);

            const result = Array.from(trackClips);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);

            // Re-calculate start times 
            let currentStart = 0;
            const updatedTrackClips = result.map((clip: Clip) => {
                const newClip = { ...clip, start: currentStart };
                currentStart += clip.duration;
                return newClip;
            });

            useCaptionStore.getState().clearCaptions('Clips reordered');
            return { clips: [...otherClips, ...updatedTrackClips] };
        }),

    cutClip: (id: string, time: number) =>
        set((state: TimelineState) => {
            const clip = state.clips.find((c: Clip) => c.id === id);
            if (!clip || (clip.type !== 'video' && clip.type !== 'audio')) return state;

            const relativeTime = time - clip.start;
            if (relativeTime <= 0 || relativeTime >= clip.duration) return state;

            const clip1: Clip = {
                ...clip,
                id: Math.random().toString(36).substr(2, 9),
                duration: relativeTime,
            };

            const clip2: Clip = {
                ...clip,
                id: Math.random().toString(36).substr(2, 9),
                start: time,
                duration: clip.duration - relativeTime,
                startTimeInFile: (clip as any).startTimeInFile + relativeTime,
            };

            // Clear captions
            useCaptionStore.getState().clearCaptions('Clip split');

            const otherClips = state.clips.filter((c) => c.id !== id);
            return {
                clips: [...otherClips, clip1, clip2].sort((a, b) => a.start - b.start),
                selectedClipId: clip2.id,
            };
        }),

    deleteClip: (id: string) =>
        set((state: TimelineState) => {
            const clipToDelete = state.clips.find((c: Clip) => c.id === id);
            if (!clipToDelete) return state;

            const otherClips = state.clips.filter((c: Clip) => c.id !== id);
            const trackId = clipToDelete.trackId;

            // Ripple subsequent clips on the same track
            const trackClips = otherClips.filter((c: Clip) => c.trackId === trackId).sort((a: Clip, b: Clip) => a.start - b.start);
            const nonTrackClips = otherClips.filter((c: Clip) => c.trackId !== trackId);

            // Clear captions
            useCaptionStore.getState().clearCaptions('Clip deleted');

            let currentStart = 0;
            const updatedTrackClips = trackClips.map(clip => {
                const newClip = { ...clip, start: currentStart };
                currentStart += clip.duration;
                return newClip;
            });

            return {
                clips: [...nonTrackClips, ...updatedTrackClips],
                selectedClipId: null
            };
        }),

    trimClip: (id, side, delta) =>
        set((state: TimelineState) => {
            const clip = state.clips.find(c => c.id === id);
            if (!clip) return state;

            const otherClips = state.clips.filter(c => c.id !== id);
            const trackId = clip.trackId;

            let newStart = clip.start;
            let newDuration = clip.duration;

            if (side === 'left') {
                const actualDelta = Math.min(delta, clip.duration - 0.1);
                newStart += actualDelta;
                newDuration -= actualDelta;
                // Since it's magnetic, we usually don't "trim left" in a way that leaves a gap.
                // If we trim left, we are essentially shortening the clip and EVERYTHING after it moves left.
                // Wait, if we trim left 1s, the clip starts at the same place (because of magnetic) but it's shorter.
                // Actually, in a magnetic timeline, trimming either side just changes duration and ripples.
            } else {
                newDuration = Math.max(0.1, clip.duration + delta);
            }

            const updatedClip = { ...clip, start: newStart, duration: newDuration };

            // Ripple
            const trackClips = [...otherClips.filter(c => c.trackId === trackId), updatedClip].sort((a, b) => a.start - b.start);
            const nonTrackClips = otherClips.filter(c => c.trackId !== trackId);

            let currentStart = 0;
            const updatedTrackClips = trackClips.map(c => {
                const nc = { ...c, start: currentStart };
                currentStart += c.duration;
                return nc;
            });

            useCaptionStore.getState().clearCaptions('Clip trimmed');
            return { clips: [...nonTrackClips, ...updatedTrackClips] };
        }),
}));

