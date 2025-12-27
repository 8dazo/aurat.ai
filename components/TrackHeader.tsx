'use client';

import React from 'react';
import { Track } from '../lib/types';
import { Film, Music, Type, ZoomIn, Lock, Unlock, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { useTimelineStore } from '../store/useTimelineStore';

interface TrackHeaderProps {
    track: Track;
}

export const TrackHeader = ({ track }: TrackHeaderProps) => {
    const updateTrack = useTimelineStore((state) => state.updateTrack);

    const Icon = {
        video: Film,
        audio: Music,
        text: Type,
        zoom: ZoomIn,
        image: Film,
    }[track.type];

    const iconColor = {
        video: 'text-blue-400',
        audio: 'text-green-400',
        text: 'text-purple-400',
        zoom: 'text-amber-400',
        image: 'text-blue-400',
    }[track.type];

    return (
        <div
            className="flex items-center justify-between px-3 border-b border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group select-none relative box-border"
            style={{ height: `${track.height}px` }}
        >
            <div className="flex items-center gap-2.5 overflow-hidden">
                <div className={`p-1.5 rounded-md bg-white/5 ${iconColor}`}>
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                </div>
                <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-white/80 truncate leading-none mb-0.5">{track.name}</span>
                    <span className="text-[9px] font-medium text-white/30 uppercase tracking-tight">{track.type}</span>
                </div>
            </div>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                <button
                    onClick={() => updateTrack(track.id, { isVisible: !track.isVisible })}
                    className="p-1 rounded hover:bg-white/10 text-white/20 hover:text-white/80 transition-colors"
                    title={track.isVisible ? "Hide track" : "Show track"}
                >
                    {track.isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-red-500/80" />}
                </button>
                <button
                    onClick={() => updateTrack(track.id, { isLocked: !track.isLocked })}
                    className="p-1 rounded hover:bg-white/10 text-white/20 hover:text-white/80 transition-colors"
                    title={track.isLocked ? "Unlock track" : "Lock track"}
                >
                    {track.isLocked ? <Lock className="w-3 h-3 text-amber-500/80" /> : <Unlock className="w-3 h-3" />}
                </button>
                <button className="p-1 rounded hover:bg-white/10 text-white/20 hover:text-white/80 transition-colors">
                    <MoreVertical className="w-3 h-3" />
                </button>
            </div>

            {/* Active Track Indicator */}
            <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-full" />
        </div>
    );
};
