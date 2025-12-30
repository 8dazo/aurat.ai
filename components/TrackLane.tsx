'use client';

import React from 'react';
import { Track, Clip, ZoomEffect } from '../lib/types';
import { useTimelineStore } from '../store/useTimelineStore';
import { ClipCard } from './ClipCard';
import { ZoomEffectCard } from './ZoomEffectCard';
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
import { restrictToHorizontalAxis, restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { Plus } from 'lucide-react';
import { useRef } from 'react';

interface TrackLaneProps {
    track: Track;
    clips: Clip[];
    zoomEffects: ZoomEffect[];
}

export const TrackLane = ({ track, clips, zoomEffects }: TrackLaneProps) => {
    const timelineScale = useTimelineStore((state) => state.timelineScale);
    const reorderClips = useTimelineStore((state) => state.reorderClips);
    const addClip = useTimelineStore((state) => state.addClip);
    const setMovieDimensions = useTimelineStore((state) => state.setMovieDimensions);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const trackClips = clips
        .filter((c) => c.trackId === track.id)
        .sort((a, b) => a.start - b.start);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = trackClips.findIndex((c) => c.id === active.id);
            const newIndex = trackClips.findIndex((c) => c.id === over.id);
            reorderClips(track.id, oldIndex, newIndex);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';

            let duration = 5;
            let width = 0;
            let height = 0;

            if (type === 'video' || type === 'audio') {
                const result = await new Promise<{ duration: number; width: number; height: number }>((resolve) => {
                    const el = document.createElement(type === 'video' ? 'video' : 'audio');
                    el.src = url;
                    el.onloadedmetadata = () => {
                        resolve({
                            duration: el.duration,
                            width: (el as HTMLVideoElement).videoWidth || 0,
                            height: (el as HTMLVideoElement).videoHeight || 0
                        });
                    };
                });
                duration = result.duration;
                width = result.width;
                height = result.height;
            } else if (type === 'image') {
                const result = await new Promise<{ width: number; height: number }>((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve({ width: img.width, height: img.height });
                    img.src = url;
                });
                width = result.width;
                height = result.height;
            }

            if (clips.length === 0 && (type === 'video' || type === 'image') && width > 0 && height > 0) {
                setMovieDimensions({ width, height });
            }

            addClip({
                id: crypto.randomUUID(),
                type: type as any,
                trackId: track.id,
                start: 0,
                duration,
                startTimeInFile: 0,
                file,
                url,
                name: file.name,
                width: width || undefined,
                height: height || undefined,
            });
        }
    };

    const lastClipEnd = trackClips.length > 0
        ? trackClips[trackClips.length - 1].start + trackClips[trackClips.length - 1].duration
        : 0;

    return (
        <div
            className="relative border-b border-white/10 w-full group overflow-visible box-border"
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToHorizontalAxis]}
                    >
                        <SortableContext
                            items={trackClips.map((c) => c.id)}
                            strategy={horizontalListSortingStrategy}
                        >
                            {trackClips.map((clip) => (
                                <ClipCard key={clip.id} clip={clip} isMagnetic={true} />
                            ))}

                            {/* Add Clip Button at the end of track */}
                            <div
                                className="absolute top-[10%] h-[80%] flex items-center justify-center transition-all"
                                style={{ left: `${lastClipEnd * timelineScale + 8}px` }}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    className="hidden"
                                    accept="video/*,audio/*,image/*"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-10 h-10 rounded-full bg-white/5 border border-dashed border-white/20 flex items-center justify-center text-white/40 hover:bg-white/10 hover:border-white/40 hover:text-white/80 transition-all active:scale-95 group"
                                    title="Add clip to this track"
                                >
                                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </div>
                        </SortableContext>
                    </DndContext>
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
