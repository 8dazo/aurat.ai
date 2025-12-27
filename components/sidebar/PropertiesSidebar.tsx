'use client';

import React from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { MediaClip, TextClip } from '@/lib/types';
import { Settings2, Trash2, Type, Clock, Play } from 'lucide-react';
import {
    SidebarContent,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem
} from '@/components/ui/sidebar';

export const PropertiesSidebar = () => {
    const selectedClipId = useTimelineStore((state) => state.selectedClipId);
    const clips = useTimelineStore((state) => state.clips);
    const updateClip = useTimelineStore((state) => state.updateClip);
    const removeClip = useTimelineStore((state) => state.removeClip);
    const setSelectedClipId = useTimelineStore((state) => state.setSelectedClipId);

    const selectedClip = clips.find((c) => c.id === selectedClipId);

    if (!selectedClip) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 p-6 text-center space-y-4 text-muted-foreground">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Settings2 className="w-6 h-6 opacity-20" />
                </div>
                <p className="text-xs leading-relaxed px-4">
                    Select a clip in the timeline to view and edit its properties.
                </p>
            </div>
        );
    }

    const isMedia = selectedClip.type !== 'text';
    const mediaClip = selectedClip as MediaClip;
    const textClip = selectedClip as TextClip;

    return (
        <div className="flex flex-col h-full bg-sidebar">
            <SidebarHeader className="border-b border-sidebar-border p-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        {selectedClip.type}
                    </span>
                    <button
                        onClick={() => {
                            removeClip(selectedClip.id);
                            setSelectedClipId(null);
                        }}
                        className="p-1.5 hover:bg-destructive/20 text-destructive rounded-md transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                <h4 className="text-sm font-semibold truncate mt-1">
                    {isMedia ? mediaClip.name : 'Text Overlay'}
                </h4>
            </SidebarHeader>

            <SidebarContent className="p-4 space-y-6">
                {/* Timing */}
                <div className="space-y-4">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Timing
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">Start (s)</span>
                            <input
                                type="number"
                                step="0.1"
                                value={selectedClip.start}
                                onChange={(e) => updateClip(selectedClip.id, { start: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-muted border border-sidebar-border rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-sidebar-ring outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">Duration (s)</span>
                            <input
                                type="number"
                                step="0.1"
                                value={selectedClip.duration}
                                onChange={(e) => updateClip(selectedClip.id, { duration: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-muted border border-sidebar-border rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-sidebar-ring outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Text Specific */}
                {!isMedia && (
                    <div className="space-y-4">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 border-t border-sidebar-border pt-4">
                            <Type className="w-3.5 h-3.5" /> Content
                        </label>
                        <textarea
                            value={textClip.text}
                            onChange={(e) => updateClip(selectedClip.id, { text: e.target.value })}
                            className="w-full h-24 bg-muted border border-sidebar-border rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-sidebar-ring outline-none transition-colors resize-none"
                            placeholder="Enter text..."
                        />

                        <div className="space-y-3">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">Font Size</span>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                value={textClip.style.fontSize}
                                onChange={(e) => updateClip(selectedClip.id, {
                                    style: { ...textClip.style, fontSize: parseInt(e.target.value) }
                                })}
                                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        <div className="space-y-3">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">Color</span>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={textClip.style.color}
                                    onChange={(e) => updateClip(selectedClip.id, {
                                        style: { ...textClip.style, color: e.target.value }
                                    })}
                                    className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer"
                                />
                                <span className="text-xs font-mono text-muted-foreground uppercase">{textClip.style.color}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Video Specific */}
                {selectedClip.type === 'video' && (
                    <div className="space-y-4">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-2 border-t border-sidebar-border pt-4">
                            <Play className="w-3.5 h-3.5" /> Source Offset
                        </label>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">Start in File (s)</span>
                            <input
                                type="number"
                                step="0.1"
                                value={mediaClip.startTimeInFile}
                                onChange={(e) => updateClip(selectedClip.id, { startTimeInFile: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-muted border border-sidebar-border rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-sidebar-ring outline-none transition-colors"
                            />
                        </div>
                    </div>
                )}
            </SidebarContent>
        </div>
    );
};
