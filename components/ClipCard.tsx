'use client';

import React, { useState, useEffect } from 'react';
import { Clip, MediaClip, Track } from '../lib/types';
import { Film, Music, Type, Image as ImageIcon, X, GripVertical } from 'lucide-react';
import { useTimelineStore } from '../store/useTimelineStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../lib/utils';

interface ClipCardProps {
    clip: Clip;
    isMagnetic?: boolean;
}

export const ClipCard = ({ clip, isMagnetic }: ClipCardProps) => {
    const removeClip = useTimelineStore((state) => state.removeClip);
    const deleteClip = useTimelineStore((state) => state.deleteClip);
    const trimClip = useTimelineStore((state) => state.trimClip);
    const updateClip = useTimelineStore((state) => state.updateClip);
    const selectedClipId = useTimelineStore((state) => state.selectedClipId);
    const setSelectedClipId = useTimelineStore((state) => state.setSelectedClipId);
    const timelineScale = useTimelineStore((state) => state.timelineScale);

    const isSelected = selectedClipId === clip.id;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortDragging,
    } = useSortable({ id: clip.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        left: `${clip.start * timelineScale}px`,
        width: `${clip.duration * timelineScale}px`,
    };

    // Transition for layout changes
    const [localStart, setLocalStart] = useState(clip.start);
    const [localDuration, setLocalDuration] = useState(clip.duration);
    const [isInteracting, setIsInteracting] = useState(false);
    const [resizeType, setResizeType] = useState<'left' | 'right' | null>(null);

    useEffect(() => {
        if (!isInteracting && !resizeType) {
            setLocalStart(clip.start);
            setLocalDuration(clip.duration);
        }
    }, [clip.start, clip.duration, isInteracting, resizeType]);

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
                if (isMagnetic) return; // Reordering is handled by @dnd-kit sensors
                setIsInteracting(true);
                setLocalStart(Math.max(0, initialStart + deltaTime));
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

            setIsInteracting(false);
            setResizeType(null);

            // Calculate final values and ripple
            const finalDeltaX = upEvent.clientX - startX;
            const finalDeltaTime = finalDeltaX / timelineScale;

            if (type === 'left') {
                trimClip(clip.id, 'left', finalDeltaTime);
            } else if (type === 'right') {
                trimClip(clip.id, 'right', finalDeltaTime);
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
            ref={setNodeRef}
            style={style}
            className={cn(
                "absolute h-[90%] top-[5%] shrink-0 rounded-md p-2 flex flex-col justify-between border select-none group",
                isSelected
                    ? "bg-white/10 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-20"
                    : "bg-white/5 border-white/10 z-10 hover:bg-white/10",
                isSortDragging ? "opacity-50 scale-95" : "opacity-100 scale-100",
                isMagnetic ? "cursor-default" : (isInteracting ? "cursor-grabbing" : "cursor-grab"),
                !isInteracting && !resizeType && "transition-all duration-200"
            )}
            onMouseDown={(e) => {
                setSelectedClipId(clip.id);
                if (!isMagnetic) startInteraction(e, 'drag');
            }}
            {...attributes}
            {...(isMagnetic ? listeners : {})}
        >
            <div className="flex items-center justify-between pointer-events-none relative z-10">
                <div className="flex items-center gap-1.5 overflow-hidden">
                    {isMagnetic && (
                        <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/40 -ml-1 transition-colors" />
                    )}
                    <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-blue-400" : "text-white/40")} />
                    <span className="text-[10px] text-white/80 truncate font-medium">
                        {(clip as MediaClip).name || 'Text Layer'}
                    </span>
                </div>

                {isSelected && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteClip(clip.id);
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
