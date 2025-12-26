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

export interface TimelineState {
    clips: Clip[];
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    selectedClipId: string | null;
}
