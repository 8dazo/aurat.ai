export type ClipType = 'video' | 'audio' | 'image' | 'text';

export interface BaseClip {
    id: string;
    type: ClipType;
    start: number; // Start time in the timeline (seconds)
    duration: number; // Duration in seconds
    startTimeInFile: number; // Start offset within the source file (seconds)
}

export interface MediaClip extends BaseClip {
    file: File;
    url: string;
    name: string;
}

export interface TextClip extends BaseClip {
    text: string;
    style: {
        fontSize: number;
        color: string;
        fontFamily: string;
        position: { x: number; y: number };
    };
}

export type Clip = MediaClip | TextClip;

export interface ZoomEffect {
    id: string;
    start: number;
    duration: number;
    level: number; // Scale factor
    rect: { x: number; y: number; width: number; height: number }; // Relative 0-1
}


export interface TimelineState {
    clips: Clip[];
    zoomEffects: ZoomEffect[];
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    selectedClipId: string | null;
    selectedZoomEffectId: string | null;
}

