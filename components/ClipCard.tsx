'use client';

import React from 'react';
import { Clip, MediaClip } from '../lib/types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Film, Music, Type, Image as ImageIcon, X } from 'lucide-react';
import { useTimelineStore } from '../store/useTimelineStore';

interface ClipCardProps {
    clip: Clip;
}

export const ClipCard = ({ clip }: ClipCardProps) => {
    const removeClip = useTimelineStore((state) => state.removeClip);
    const selectedClipId = useTimelineStore((state) => state.selectedClipId);
    const setSelectedClipId = useTimelineStore((state) => state.setSelectedClipId);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: clip.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        width: `${clip.duration * 50}px`, // 50px per second
    };

    const Icon = {
        video: Film,
        audio: Music,
        text: Type,
        image: ImageIcon,
    }[clip.type];

    const isSelected = selectedClipId === clip.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative h-16 shrink-0 rounded-lg p-2 flex flex-col justify-between border select-none transition-shadow ${isDragging ? 'opacity-50 z-50' : 'opacity-100'
                } ${isSelected
                    ? 'bg-blue-500/30 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                    : 'bg-white/10 border-white/20'
                } group`}
            onClick={(e) => {
                e.stopPropagation();
                setSelectedClipId(clip.id);
            }}
            {...attributes}
            {...listeners}
        >
            <div className="flex items-center justify-between pointer-events-none">
                <Icon className="w-4 h-4 text-white/60" />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        removeClip(clip.id);
                    }}
                    className="pointer-events-auto p-1 rounded-full hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <X className="w-3 h-3 text-white/60" />
                </button>
            </div>
            <div className="text-[10px] text-white/80 truncate font-medium pointer-events-none">
                {(clip as MediaClip).name || 'Text Layer'}
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-white/20 rounded-full w-full pointer-events-none overflow-hidden">
                <div className="h-full bg-white/40" style={{ width: '100%' }} />
            </div>
        </div>
    );
};
