'use client';

import React, { useState, useEffect } from 'react';
import { ZoomEffect } from '../lib/types';
import { useTimelineStore } from '../store/useTimelineStore';
import { ZoomIn, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '../store/redux/slices/sidebarSlice';

interface ZoomEffectCardProps {
    effect: ZoomEffect;
}

export const ZoomEffectCard = ({ effect }: ZoomEffectCardProps) => {
    const dispatch = useDispatch();
    const removeZoomEffect = useTimelineStore((state) => state.removeZoomEffect);
    const updateZoomEffect = useTimelineStore((state) => state.updateZoomEffect);
    const selectedZoomEffectId = useTimelineStore((state) => state.selectedZoomEffectId);
    const setSelectedZoomEffectId = useTimelineStore((state) => state.setSelectedZoomEffectId);
    const timelineScale = useTimelineStore((state) => state.timelineScale);

    const isSelected = selectedZoomEffectId === effect.id;

    // Local state for smooth dragging/resizing
    const [localStart, setLocalStart] = useState(effect.start);
    const [localDuration, setLocalDuration] = useState(effect.duration);
    const [isDragging, setIsDragging] = useState(false);
    const [resizeType, setResizeType] = useState<'left' | 'right' | null>(null);

    useEffect(() => {
        if (!isDragging && !resizeType) {
            setLocalStart(effect.start);
            setLocalDuration(effect.duration);
        }
    }, [effect.start, effect.duration, isDragging, resizeType]);

    const startInteraction = (e: React.MouseEvent, type: 'drag' | 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedZoomEffectId(effect.id);
        dispatch(setActiveTab('zoom'));

        const duration = useTimelineStore.getState().duration;
        const startX = e.clientX;
        const initialStart = localStart;
        const initialDuration = localDuration;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaTime = deltaX / timelineScale;

            if (type === 'drag') {
                const newStart = Math.max(0, Math.min(initialStart + deltaTime, duration - initialDuration));
                setLocalStart(newStart);
                setIsDragging(true);
            } else if (type === 'left') {
                const newStart = Math.max(0, Math.min(initialStart + deltaTime, initialStart + initialDuration - 0.1));
                const newDuration = initialDuration - (newStart - initialStart);
                setLocalStart(newStart);
                setLocalDuration(newDuration);
                setResizeType('left');
            } else if (type === 'right') {
                const newDuration = Math.max(0.1, Math.min(initialDuration + deltaTime, duration - initialStart));
                setLocalDuration(newDuration);
                setResizeType('right');
            }
        };

        const onMouseUp = (upEvent: MouseEvent) => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            setIsDragging(false);
            setResizeType(null);

            const finalDeltaX = upEvent.clientX - startX;
            const finalDeltaTime = finalDeltaX / timelineScale;

            let newStart = effect.start;
            let newDuration = effect.duration;

            if (type === 'drag') {
                newStart = Math.max(0, Math.min(effect.start + finalDeltaTime, duration - effect.duration));
            } else if (type === 'left') {
                newStart = Math.max(0, Math.min(effect.start + finalDeltaTime, effect.start + effect.duration - 0.1));
                newDuration = effect.duration - (newStart - effect.start);
            } else if (type === 'right') {
                newDuration = Math.max(0.1, Math.min(effect.duration + finalDeltaTime, duration - effect.start));
            }

            // Overlap detection
            const otherEffects = useTimelineStore.getState().zoomEffects.filter(e => e.id !== effect.id && e.trackId === effect.trackId);
            const hasOverlap = otherEffects.some(other => {
                const otherEnd = other.start + other.duration;
                const currentEnd = newStart + newDuration;
                return (newStart < otherEnd && currentEnd > other.start);
            });

            if (!hasOverlap) {
                updateZoomEffect(effect.id, { start: newStart, duration: newDuration });
            } else {
                // Snap back by resetting local state
                setLocalStart(effect.start);
                setLocalDuration(effect.duration);
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div
            className={`zoom-effect-card absolute h-[80%] top-[10%] rounded-md border flex items-center justify-between px-2 select-none transition-all ${isSelected
                ? 'bg-blue-500/40 border-blue-400 text-white z-20 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400 z-10 hover:bg-blue-500/20'
                } ${isDragging ? 'cursor-grabbing opacity-70' : 'cursor-grab'}`}
            style={{
                left: `${localStart * timelineScale}px`,
                width: `${localDuration * timelineScale}px`,
                transition: isDragging || resizeType ? 'none' : 'all 0.2s',
            }}
            onMouseDown={(e) => startInteraction(e, 'drag')}
        >
            <div className="flex items-center gap-1.5 overflow-hidden pointer-events-none">
                <ZoomIn className="w-3 h-3 shrink-0" />
                <span className="text-[10px] font-medium truncate">Zoom {effect.level}x</span>
            </div>

            {isSelected && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        removeZoomEffect(effect.id);
                    }}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X className="w-2.5 h-2.5" />
                </button>
            )}

            {/* Resize Handles */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/40 z-30"
                onMouseDown={(e) => startInteraction(e, 'left')}
            />
            <div
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-white/40 z-30"
                onMouseDown={(e) => startInteraction(e, 'right')}
            />
        </div>
    );
};
