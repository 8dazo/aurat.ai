import { create } from 'zustand';
import { Caption, CaptionConfig } from '../lib/types';

interface CaptionState {
    captions: Caption[];
    isCaptionEnabled: boolean;
    captionPosition: 'top' | 'bottom';
    config: CaptionConfig;
}

interface CaptionActions {
    setCaptions: (captions: Caption[]) => void;
    setIsCaptionEnabled: (enabled: boolean) => void;
    setCaptionPosition: (position: 'top' | 'bottom') => void;
    updateConfig: (updates: Partial<CaptionConfig>) => void;
}

const DEFAULT_CONFIG: CaptionConfig = {
    fontSize: 48,
    fontFamily: 'Inter, sans-serif',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 20,
    maxWidth: 0.9, // 90% of video width
};

export const useCaptionStore = create<CaptionState & CaptionActions>((set) => ({
    captions: [],
    isCaptionEnabled: false,
    captionPosition: 'bottom',
    config: DEFAULT_CONFIG,

    setCaptions: (captions) => set({ captions }),
    setIsCaptionEnabled: (isCaptionEnabled) => set({ isCaptionEnabled }),
    setCaptionPosition: (captionPosition) => set({ captionPosition }),
    updateConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } })),
}));
