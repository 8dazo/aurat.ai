'use client';

import React from 'react';
import { Track, Clip, ZoomEffect } from '../lib/types';
import { useTimelineStore } from '../store/useTimelineStore';
import { ClipCard } from './ClipCard';
import { ZoomEffectCard } from './ZoomEffectCard';

interface TrackLaneProps {
    track: Track;
    clips: Clip[];
    zoomEffects: ZoomEffect[];
}

export const TrackLane = ({ track, clips, zoomEffects }: TrackLaneProps) => {
    const timelineScale = useTimelineStore((state) => state.timelineScale);
    const setTimelineScale = useTimelineStore((state) => state.setTimelineScale);

    return (
        <div
            className="relative border-b border-white/10 w-full group overflow-hidden box-border"
            style={{ height: `${track.height}px` }}
        >
            {/* Background Grid - subtle lines every second */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
                {[...Array(100)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-white"
                        style={{ left: `${i * timelineScale}px` }}
                    />
                ))}
            </div>

            {/* Content Container */}
            <div className="relative h-full w-full">
                {track.type === 'zoom' ? (
                    zoomEffects.map((effect) => (
                        <ZoomEffectCard key={effect.id} effect={effect} />
                    ))
                ) : (
                    clips.filter(c => c.trackId === track.id).map((clip) => (
                        <ClipCard key={clip.id} clip={clip} />
                    ))
                )}
            </div>

            {!track.isVisible && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-none flex items-center justify-center">
                    <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Hidden</span>
                </div>
            )}
        </div>
    );
};
