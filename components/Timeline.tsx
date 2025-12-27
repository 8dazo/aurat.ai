'use client';

import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTimelineStore } from '../store/useTimelineStore';
import { ClipCard } from './ClipCard';

export const Timeline = () => {
    const clips = useTimelineStore((state) => state.clips);
    const setClips = useTimelineStore((state) => state.setClips);
    const addClip = useTimelineStore((state) => state.addClip);
    const currentTime = useTimelineStore((state) => state.currentTime);
    const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);
    const duration = useTimelineStore((state) => state.duration);
    const zoomEffects = useTimelineStore((state) => state.zoomEffects);
    const selectedZoomEffectId = useTimelineStore((state) => state.selectedZoomEffectId);
    const setSelectedZoomEffectId = useTimelineStore((state) => state.setSelectedZoomEffectId);
    const setSelectedClipId = useTimelineStore((state) => state.setSelectedClipId);
    const addZoomEffect = useTimelineStore((state) => state.addZoomEffect);


    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = clips.findIndex((c) => c.id === active.id);
            const newIndex = clips.findIndex((c) => c.id === over.id);

            const newClips = arrayMove(clips, oldIndex, newIndex);

            // Update start times based on ordering for MVP
            let currentPos = 0;
            const updatedClips = newClips.map((clip) => {
                const updated = { ...clip, start: currentPos };
                currentPos += clip.duration;
                return updated;
            });

            setClips(updatedClips);
        }
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('.zoom-effect-card') || (e.target as HTMLElement).closest('.clip-card')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x + e.currentTarget.scrollLeft) / 50; // 50px per second
        setCurrentTime(time);
        setSelectedClipId(null);
        setSelectedZoomEffectId(null);
    };

    const handleAddZoom = () => {
        const id = Math.random().toString(36).substr(2, 9);
        addZoomEffect({
            id,
            start: currentTime,
            duration: 2,
            level: 1.5,
            rect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
        });
        setSelectedZoomEffectId(id);
    };


    return (
        <div className="flex flex-col w-full bg-black/40 backdrop-blur-xl border-t border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <span className="text-xs text-white/60 font-mono">
                        {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                    </span>
                    <button
                        onClick={handleAddZoom}
                        className="text-[10px] px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 border border-blue-500/30 rounded flex items-center gap-1 transition-colors"
                    >
                        + Zoom
                    </button>
                </div>
            </div>


            <div
                className="relative bg-white/5 rounded-lg overflow-x-auto overflow-y-hidden border border-white/5 timeline-scrollbar"
                onClick={handleTimelineClick}
            >
                <div className="relative min-w-full w-fit p-2 flex flex-col gap-2">

                    {/* Scrubber Line */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10 pointer-events-none transition-all duration-75"
                        style={{ left: `${currentTime * 50}px` }}
                    >
                        <div className="absolute top-0 -left-1.5 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex items-center h-16 px-2 gap-1 relative border-b border-white/5">
                            <SortableContext
                                items={clips.map((c) => c.id)}
                                strategy={horizontalListSortingStrategy}
                            >
                                {clips.map((clip) => (
                                    <ClipCard key={clip.id} clip={clip} />
                                ))}
                            </SortableContext>
                        </div>
                    </DndContext>

                    {/* Zoom Track */}
                    <div className="relative h-12 flex items-center px-2">
                        <span className="absolute left-0 top-0 text-[8px] text-white/20 uppercase font-bold px-1 py-0.5 pointer-events-none">Zoom</span>
                        {zoomEffects.map((effect) => (
                            <div
                                key={effect.id}
                                className={`zoom-effect-card absolute h-8 rounded-md border text-[10px] flex items-center justify-center cursor-pointer transition-all ${selectedZoomEffectId === effect.id
                                        ? 'bg-blue-500/40 border-blue-400 text-white'
                                        : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                    }`}
                                style={{
                                    left: `${effect.start * 50 + 8}px`, // +8 for padding
                                    width: `${effect.duration * 50}px`,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedZoomEffectId(effect.id);
                                    setSelectedClipId(null);
                                }}
                            >
                                Zoom {effect.level}x
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
