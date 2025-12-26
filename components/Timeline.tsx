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
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x + e.currentTarget.scrollLeft) / 50; // 50px per second
        setCurrentTime(time);
        setSelectedClipId(null);
    };

    return (
        <div className="flex flex-col w-full bg-black/40 backdrop-blur-xl border-t border-white/10 p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60 font-mono">
                    {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                </span>
            </div>

            <div
                className="relative h-24 bg-white/5 rounded-lg overflow-x-auto overflow-y-hidden border border-white/5 timeline-scrollbar"
                onClick={handleTimelineClick}
            >
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
                    <div className="flex items-center h-full px-2 gap-1 min-w-full w-fit">
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
            </div>
        </div>
    );
};
