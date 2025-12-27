'use client';

import React, { useState, useEffect } from 'react';
import { Clip, MediaClip, Track } from '../lib/types';
import { Film, Music, Type, Image as ImageIcon, X } from 'lucide-react';
import { useTimelineStore } from '../store/useTimelineStore';

interface ClipCardProps {
    clip: Clip;
}

export const ClipCard = ({ clip }: ClipCardProps) => {
    const removeClip = useTimelineStore((state) => state.removeClip);
    const updateClip = useTimelineStore((state) => state.updateClip);
    const selectedClipId = useTimelineStore((state) => state.selectedClipId);
    const setSelectedClipId = useTimelineStore((state) => state.setSelectedClipId);
    const timelineScale = useTimelineStore((state) => state.timelineScale);

    const isSelected = selectedClipId === clip.id;

    // Local state for smooth dragging/resizing
    const [localStart, setLocalStart] = useState(clip.start);
    const [localDuration, setLocalDuration] = useState(clip.duration);
    const [isDragging, setIsDragging] = useState(false);
    const [resizeType, setResizeType] = useState<'left' | 'right' | null>(null);

    useEffect(() => {
        if (!isDragging && !resizeType) {
            setLocalStart(clip.start);
            setLocalDuration(clip.duration);
        }
    }, [clip.start, clip.duration, isDragging, resizeType]);

    // Improved mouse handling with window listeners
    const startInteraction = (e: React.MouseEvent, type: 'drag' | 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedClipId(clip.id);

        if (clip.type === 'video') return;

        const startX = e.clientX;
        const initialStart = localStart; // Use local state for initial values
        const initialDuration = localDuration; // Use local state for initial values

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaTime = deltaX / timelineScale;

            if (type === 'drag') {
                setLocalStart(Math.max(0, initialStart + deltaTime));
                setIsDragging(true);
            } else if (type === 'left') {
                const newStart = Math.max(0, initialStart + deltaTime);
                const newDuration = Math.max(0.1, initialDuration - (newStart - initialStart));
                setLocalStart(newStart);
                setLocalDuration(newDuration);
                setResizeType('left');
            } else if (type === 'right') {
                setLocalDuration(Math.max(0.1, initialDuration + deltaTime));
                setResizeType('right');
            }
        };

        const onMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            setIsDragging(false);
            setResizeType(null);

            // Calculate final values based on original clip properties and total delta
            const finalDeltaX = upEvent.clientX - startX;
            const finalDeltaTime = finalDeltaX / timelineScale;

            if (type === 'drag') {
                updateClip(clip.id, { start: Math.max(0, clip.start + finalDeltaTime) });
            } else if (type === 'left') {
                const newStart = Math.max(0, clip.start + finalDeltaTime);
                const newDuration = Math.max(0.1, clip.duration - (newStart - clip.start));
                updateClip(clip.id, { start: newStart, duration: newDuration });
            } else if (type === 'right') {
                updateClip(clip.id, { duration: Math.max(0.1, clip.duration + finalDeltaTime) });
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const Icon = {
        video: Film,
        audio: Music,
        text: Type,
        image: ImageIcon,
        zoom: Film,
    }[clip.type];

    return (
        <div
            className={`absolute h-[90%] top-[5%] shrink-0 rounded-md p-2 flex flex-col justify-between border select-none transition-all group ${isSelected
                ? 'bg-white/10 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20'
                : 'bg-white/5 border-white/10 z-10 hover:bg-white/10'
                } ${clip.type === 'video' ? 'cursor-default' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')} `}
            style={{
                left: `${localStart * timelineScale}px`,
                width: `${localDuration * timelineScale}px`,
                transition: isDragging || resizeType ? 'none' : 'all 0.2s',
            }}
            onMouseDown={(e) => startInteraction(e, 'drag')}
        >
            <div className="flex items-center justify-between pointer-events-none relative z-10">
                <div className="flex items-center gap-1.5 overflow-hidden">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-white/40'} `} />
                    <span className="text-[10px] text-white/80 truncate font-medium">
                        {(clip as MediaClip).name || 'Text Layer'}
                    </span>
                </div>

                {isSelected && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeClip(clip.id);
                        }}
                        className="pointer-events-auto p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X className="w-2.5 h-2.5 text-white/40" />
                    </button>
                )}
            </div>

            {/* Thumbnail/Preview */}
            {(clip.type === 'video' || clip.type === 'image') && (clip as MediaClip).url && (
                <div className="absolute inset-x-0 bottom-1 top-6 overflow-hidden rounded-sm opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
                    {clip.type === 'video' ? (
                        <video
                            src={(clip as MediaClip).url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                        />
                    ) : (
                        <img
                            src={(clip as MediaClip).url}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    )}
                </div>
            )}

            {/* Resize Handles */}
            {clip.type !== 'video' && (
                <>
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-blue-500/30 active:bg-blue-500/50 z-30"
                        onMouseDown={(e) => startInteraction(e, 'left')}
                    />
                    <div
                        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-blue-500/30 active:bg-blue-500/50 z-30"
                        onMouseDown={(e) => startInteraction(e, 'right')}
                    />
                </>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 overflow-hidden rounded-b-md pointer-events-none">
                <div
                    className={`h-full ${isSelected ? 'bg-blue-500' : 'bg-white/20'} `}
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
};
