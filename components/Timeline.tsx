'use client';

import React, { useRef, useState } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { TrackHeader } from './TrackHeader';
import { TrackLane } from './TrackLane';
import { Plus, Maximize2, Minus, Search } from 'lucide-react';

export const Timeline = () => {
    const tracks = useTimelineStore((state) => state.tracks);
    const clips = useTimelineStore((state) => state.clips);
    const zoomEffects = useTimelineStore((state) => state.zoomEffects);
    const currentTime = useTimelineStore((state) => state.currentTime);
    const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);
    const duration = useTimelineStore((state) => state.duration);
    const timelineScale = useTimelineStore((state) => state.timelineScale);
    const setTimelineScale = useTimelineStore((state) => state.setTimelineScale);
    const timelineHeight = useTimelineStore((state) => state.timelineHeight);
    const setTimelineHeight = useTimelineStore((state) => state.setTimelineHeight);
    const setSelectedClipId = useTimelineStore((state) => state.setSelectedClipId);
    const setSelectedZoomEffectId = useTimelineStore((state) => state.setSelectedZoomEffectId);
    const addZoomEffect = useTimelineStore((state) => state.addZoomEffect);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isResizingHeight, setIsResizingHeight] = useState(false);
    const [ghostTime, setGhostTime] = useState<number | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const isPlaying = useTimelineStore((state) => state.isPlaying);
    const setIsPlaying = useTimelineStore((state) => state.setIsPlaying);

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning) return; // Don't jump if we were just panning
        if ((e.target as HTMLElement).closest('.zoom-effect-card') || (e.target as HTMLElement).closest('.clip-card')) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x + e.currentTarget.scrollLeft) / timelineScale;
        setCurrentTime(time);
        setSelectedClipId(null);
        setSelectedZoomEffectId(null);
    };

    const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only pan if we click the background (not a clip, zoom, or ruler)
        if ((e.target as HTMLElement).closest('.zoom-effect-card') || (e.target as HTMLElement).closest('.clip-card')) return;

        // If clicking the ruler part, we probably want to just jump time, or start scrubbing
        // But the user requested "move left to right and vice versa using the cursor"

        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        const startX = e.clientX;
        const startScrollLeft = scrollContainer.scrollLeft;
        let hasMoved = false;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            if (Math.abs(deltaX) > 5) {
                if (!isPanning) setIsPanning(true);
                hasMoved = true;
                scrollContainer.scrollLeft = startScrollLeft - deltaX;
            }
        };

        const onMouseUp = () => {
            if (hasMoved) {
                // Prevent click event if we actually moved
                setTimeout(() => setIsPanning(false), 50);
            }
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const handleAddZoom = () => {
        const id = Math.random().toString(36).substr(2, 9);
        const zoomTrack = tracks.find(t => t.type === 'zoom') || tracks[0];
        addZoomEffect({
            id,
            trackId: zoomTrack.id,
            start: currentTime,
            duration: 2,
            level: 1.5,
            rect: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }
        });
        setSelectedZoomEffectId(id);
    };

    const handleHeightResize = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingHeight(true);
        const startY = e.clientY;
        const startHeight = timelineHeight;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = startY - moveEvent.clientY;
            setTimelineHeight(Math.max(150, Math.min(600, startHeight + deltaY)));
        };

        const onMouseUp = () => {
            setIsResizingHeight(false);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div
            className="flex flex-col w-full bg-[#111] border-t border-white/10 relative transition-all"
            style={{ height: `${timelineHeight}px` }}
        >
            {/* Height Resize Handle */}
            <div
                className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-50 hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
                onMouseDown={handleHeightResize}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            {Math.floor((ghostTime ?? currentTime) / 60).toString().padStart(2, '0')}:
                            {((ghostTime ?? currentTime) % 60).toFixed(2).padStart(5, '0')}
                        </span>
                        <span className="text-[11px] font-mono text-white/30">
                            / {Math.floor(duration / 60).toString().padStart(2, '0')}:
                            {(duration % 60).toFixed(2).padStart(5, '0')}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-md border border-white/5">
                        <button
                            onClick={() => setTimelineScale(Math.max(10, timelineScale - 10))}
                            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <div className="flex items-center gap-1 px-2 text-[10px] text-white/40 font-medium">
                            <Search className="w-3 h-3" />
                            <span>{Math.round((timelineScale / 50) * 100)}%</span>
                        </div>
                        <button
                            onClick={() => setTimelineScale(Math.min(200, timelineScale + 10))}
                            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleAddZoom}
                        className="text-[10px] px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95"
                    >
                        <Maximize2 className="w-3 h-3" />
                        Add Zoom Effect
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-y-auto no-scrollbar relative">
                {/* Track Headers (Left Sidebar) */}
                <div className="w-48 bg-black/40 border-r border-white/10 flex flex-col shrink-0 sticky left-0 z-30 h-fit">
                    {/* Header Spacer - Matches Time Ruler Height */}
                    <div className="h-12 border-b border-white/10 bg-black/20" />

                    {tracks.map(track => (
                        <TrackHeader key={track.id} track={track} />
                    ))}
                    <button className="mt-2 mx-3 py-1.5 border border-dashed border-white/10 rounded-md text-[10px] text-white/30 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-1">
                        <Plus className="w-3 h-3" />
                        Add Track
                    </button>
                </div>

                {/* Track Lanes (Timeline) */}
                <div
                    ref={scrollContainerRef}
                    className={`flex-1 relative overflow-x-auto overflow-y-hidden no-scrollbar bg-[#0a0a0a] ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
                    onClick={handleTimelineClick}
                    onMouseDown={handleTimelineMouseDown}
                >
                    <div className="relative min-w-full" style={{ width: `${(duration + 2) * timelineScale}px` }}>

                        {/* Time Markers - Sticky Top */}
                        <div className="sticky top-0 h-12 border-b border-white/10 flex items-end bg-[#0a0a0a] z-40">
                            {[...Array(Math.ceil(duration + 10))].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute bottom-0 border-l border-white/10 flex flex-col justify-end"
                                    style={{ left: `${i * timelineScale}px`, height: i % 5 === 0 ? '10px' : '5px' }}
                                >
                                    {i % 5 === 0 && (
                                        <span className="absolute bottom-3 left-1 text-[8px] text-white/20 font-mono">
                                            {i}s
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Ghost Scrubber (Shadow) */}
                        {ghostTime !== null && (
                            <div className="absolute top-0 bottom-0 w-0.5 bg-blue-500/30 z-[45] pointer-events-none" style={{ left: `${ghostTime * timelineScale}px` }}>
                                <div className="absolute top-0 -left-[6px] w-3 h-6 bg-blue-500/20 rounded-b-sm border border-blue-500/30 blur-[1px]" />
                            </div>
                        )}

                        {/* Actual Scrubber Line */}
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-50 group/scrubber"
                            style={{ left: `${currentTime * timelineScale}px` }}
                        >
                            <div
                                className="absolute top-0 -left-[8px] w-4 h-6 bg-blue-500 rounded-b-sm shadow-[0_0_15px_rgba(59,130,246,0.8)] flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-all z-[60]"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    const scrollContainer = scrollContainerRef.current;
                                    if (!scrollContainer) return;

                                    document.body.classList.add('grabbing-scrubber');

                                    const getTime = (clientX: number) => {
                                        const rect = scrollContainer.getBoundingClientRect();
                                        const x = clientX - rect.left + scrollContainer.scrollLeft;
                                        return Math.max(0, x / timelineScale);
                                    };

                                    const onMouseMove = (moveEvent: MouseEvent) => {
                                        const newTime = Math.min(getTime(moveEvent.clientX), duration);
                                        if (isPlaying) {
                                            setGhostTime(newTime);
                                        } else {
                                            setCurrentTime(newTime);
                                        }
                                    };

                                    const onMouseUp = () => {
                                        setGhostTime(null);
                                        document.body.classList.remove('grabbing-scrubber');
                                        window.removeEventListener('mousemove', onMouseMove);
                                        window.removeEventListener('mouseup', onMouseUp);
                                    };

                                    window.addEventListener('mousemove', onMouseMove);
                                    window.addEventListener('mouseup', onMouseUp);
                                }}
                            >
                                <div className="w-[1px] h-3 bg-white/60" />
                            </div>

                            {/* Visual Glow Line */}
                            <div className="absolute top-0 bottom-0 -left-1 -right-1 bg-blue-500/10 blur-[2px] pointer-events-none" />
                        </div>

                        {/* Tracks */}
                        <div className="flex flex-col">
                            {tracks.map(track => (
                                <TrackLane
                                    key={track.id}
                                    track={track}
                                    clips={clips}
                                    zoomEffects={zoomEffects}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
