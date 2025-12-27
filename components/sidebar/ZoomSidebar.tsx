'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { ZoomIn, Trash2, Clock, Maximize, Move } from 'lucide-react';

export const ZoomSidebar = () => {
    const selectedZoomEffectId = useTimelineStore((state) => state.selectedZoomEffectId);
    const zoomEffects = useTimelineStore((state) => state.zoomEffects);
    const updateZoomEffect = useTimelineStore((state) => state.updateZoomEffect);
    const removeZoomEffect = useTimelineStore((state) => state.removeZoomEffect);
    const setSelectedZoomEffectId = useTimelineStore((state) => state.setSelectedZoomEffectId);
    const clips = useTimelineStore((state) => state.clips);
    const currentTime = useTimelineStore((state) => state.currentTime);
    const movieDimensions = useTimelineStore((state) => state.movieDimensions);

    const selectedEffect = zoomEffects.find((e) => e.id === selectedZoomEffectId);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [previewBuffer, setPreviewBuffer] = useState<HTMLCanvasElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);


    // Effect to update the preview buffer when the start time or clip changes
    useEffect(() => {
        if (!selectedEffect) return;

        const activeClip = clips.find(c => c.type === 'video' && selectedEffect.start >= c.start && selectedEffect.start <= c.start + c.duration);
        if (activeClip && activeClip.type === 'video') {
            const video = document.createElement('video');
            video.src = (activeClip as any).url;
            video.muted = true;
            video.onloadedmetadata = () => {
                video.currentTime = (activeClip as any).startTimeInFile + (selectedEffect.start - activeClip.start);
            };
            video.onseeked = () => {
                const buffer = document.createElement('canvas');
                // Use movie permissions instead of hardcoded 16:9
                const scale = Math.min(320 / movieDimensions.width, 180 / movieDimensions.height);
                buffer.width = movieDimensions.width * scale;
                buffer.height = movieDimensions.height * scale;
                const bctx = buffer.getContext('2d');
                if (bctx) {
                    bctx.drawImage(video, 0, 0, buffer.width, buffer.height);
                    setPreviewBuffer(buffer);
                }
            };
            // Fallback for already loaded videos
            if (video.readyState >= 1) {
                video.currentTime = (activeClip as any).startTimeInFile + (selectedEffect.start - activeClip.start);
            }
        } else {
            setPreviewBuffer(null);
        }
    }, [selectedEffect?.id, selectedEffect?.start, clips, movieDimensions]);

    // Effect to render the canvas (background frame + overlay)
    useEffect(() => {
        if (!canvasRef.current || !selectedEffect) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvasRef.current;
        ctx.clearRect(0, 0, width, height);

        if (previewBuffer) {
            ctx.drawImage(previewBuffer, 0, 0, width, height);
        }

        drawOverlay(ctx);

        function drawOverlay(c: CanvasRenderingContext2D) {
            const { x, y, width: rw, height: rh } = selectedEffect!.rect;

            // Draw dark overlay outside selection
            c.fillStyle = 'rgba(0, 0, 0, 0.5)';
            c.fillRect(0, 0, width, y * height);
            c.fillRect(0, (y + rh) * height, width, (1 - (y + rh)) * height);
            c.fillRect(0, y * height, x * width, rh * height);
            c.fillRect((x + rw) * width, y * height, (1 - (x + rw)) * width, rh * height);

            // Draw selection rect
            c.strokeStyle = '#3b82f6';
            c.lineWidth = 2;
            c.strokeRect(x * width, y * height, rw * width, rh * height);

            // Draw handles
            c.fillStyle = '#fff';
            c.fillRect(x * width + rw * width - 4, y * height + rh * height - 4, 8, 8);
        }
    }, [selectedEffect, previewBuffer]);




    if (!selectedEffect) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 p-6 text-center space-y-4 text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 opacity-20" />
                </div>
                <p className="text-xs leading-relaxed px-4">
                    Select a zoom effect in the timeline to edit its area and level.
                </p>
            </div>
        );
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width;
        const my = (e.clientY - rect.top) / rect.height;

        const { x, y, width: rw, height: rh } = selectedEffect.rect;

        // Check for resize handle (bottom-right)
        if (Math.abs(mx - (x + rw)) < 0.05 && Math.abs(my - (y + rh)) < 0.05) {
            setDragMode('resize');
        } else if (mx >= x && mx <= x + rw && my >= y && my <= y + rh) {
            setDragMode('move');
        } else {
            setDragMode(null);
            return;
        }
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || !dragMode) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width;
        const my = (e.clientY - rect.top) / rect.height;

        if (dragMode === 'resize') {
            // Relative width and height are now independent but we want to maintain aspect ratio
            // Since our canvas has the same aspect ratio as the movie, 
            // a relative width of 'w' and relative height of 'w' will have the movie's aspect ratio.
            const newSide = Math.max(0.1, Math.min(1 - selectedEffect.rect.x, 1 - selectedEffect.rect.y, mx - selectedEffect.rect.x, my - selectedEffect.rect.y));

            updateZoomEffect(selectedEffect.id, {
                rect: { ...selectedEffect.rect, width: newSide, height: newSide },
                level: 1 / newSide, // Implicit level update
            });
        } else if (dragMode === 'move') {


            const newX = Math.max(0, Math.min(1 - selectedEffect.rect.width, mx - selectedEffect.rect.width / 2));
            const newY = Math.max(0, Math.min(1 - selectedEffect.rect.height, my - selectedEffect.rect.height / 2));
            updateZoomEffect(selectedEffect.id, {
                rect: { ...selectedEffect.rect, x: newX, y: newY }
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setDragMode(null);
    };

    const sidebarCanvasAspect = {
        aspectRatio: `${movieDimensions.width} / ${movieDimensions.height}`
    };

    return (
        <div className="flex flex-col h-full bg-sidebar">
            <SidebarHeader className="border-b border-sidebar-border p-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        Zoom Effect
                    </span>
                    <button
                        onClick={() => {
                            removeZoomEffect(selectedEffect.id);
                            setSelectedZoomEffectId(null);
                        }}
                        className="p-1.5 hover:bg-destructive/20 text-destructive rounded-md transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </SidebarHeader>

            <SidebarContent className="p-4 space-y-6">
                <div className="space-y-4">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Maximize className="w-3.5 h-3.5" /> Area Selection
                    </label>
                    <div
                        className="relative bg-black rounded-lg overflow-hidden border border-sidebar-border"
                        style={sidebarCanvasAspect}
                    >
                        <canvas
                            ref={canvasRef}
                            width={320}
                            height={320 * (movieDimensions.height / movieDimensions.width)}
                            className="w-full h-full cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                    </div>
                    <p className="text-[10px] text-white/40 italic">Drag to move, use bottom-right handle to resize.</p>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 border-t border-sidebar-border pt-4">
                        <ZoomIn className="w-3.5 h-3.5" /> Zoom Level
                    </label>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">Scale Factor</span>
                            <span className="text-xs font-mono text-primary">{selectedEffect.level.toFixed(2)}x</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            step="0.1"
                            value={selectedEffect.level}
                            onChange={(e) => {
                                const level = parseFloat(e.target.value);
                                const side = 1 / level;
                                // Keep it centered when manually changing level
                                const newX = Math.max(0, Math.min(1 - side, selectedEffect.rect.x + (selectedEffect.rect.width - side) / 2));
                                const newY = Math.max(0, Math.min(1 - side, selectedEffect.rect.y + (selectedEffect.rect.height - side) / 2));
                                updateZoomEffect(selectedEffect.id, {
                                    level,
                                    rect: { x: newX, y: newY, width: side, height: side }
                                });
                            }}


                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 border-t border-sidebar-border pt-4">
                        <Clock className="w-3.5 h-3.5" /> Timing
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">Start (s)</span>
                            <input
                                type="number"
                                step="0.1"
                                value={selectedEffect.start}
                                onChange={(e) => updateZoomEffect(selectedEffect.id, { start: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-muted border border-sidebar-border rounded-md px-2 py-1.5 text-xs outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">Duration (s)</span>
                            <input
                                type="number"
                                step="0.1"
                                value={selectedEffect.duration}
                                onChange={(e) => updateZoomEffect(selectedEffect.id, { duration: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-muted border border-sidebar-border rounded-md px-2 py-1.5 text-xs outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </SidebarContent>
        </div>
    );
};
