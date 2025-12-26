'use client';

import React from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { MediaClip, TextClip } from '../lib/types';
import { Settings2, Trash2, Type, Clock, Play } from 'lucide-react';

export const PropertiesPanel = () => {
    const selectedClipId = useTimelineStore((state) => state.selectedClipId);
    const clips = useTimelineStore((state) => state.clips);
    const updateClip = useTimelineStore((state) => state.updateClip);
    const removeClip = useTimelineStore((state) => state.removeClip);
    const setSelectedClipId = useTimelineStore((state) => state.setSelectedClipId);

    const selectedClip = clips.find((c) => c.id === selectedClipId);

    if (!selectedClip) {
        return (
            <div className="p-6 flex flex-col items-center justify-center flex-1 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Settings2 className="w-6 h-6 text-white/20" />
                </div>
                <p className="text-xs text-white/40 leading-relaxed px-4">
                    Select a clip in the timeline to view and edit its properties.
                </p>
            </div>
        );
    }

    const isMedia = selectedClip.type !== 'text';
    const mediaClip = selectedClip as MediaClip;
    const textClip = selectedClip as TextClip;

    return (
        <div className="flex-1 overflow-y-auto timeline-scrollbar">
            <div className="p-4 space-y-6">
                {/* Header/Info */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
                            {selectedClip.type}
                        </span>
                        <button
                            onClick={() => {
                                removeClip(selectedClip.id);
                                setSelectedClipId(null);
                            }}
                            className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <h4 className="text-sm font-semibold truncate">
                        {isMedia ? mediaClip.name : 'Text Overlay'}
                    </h4>
                </div>

                <div className="h-px bg-white/10" />

                {/* Timing */}
                <div className="space-y-4">
                    <label className="text-xs font-medium text-white/60 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Timing
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-white/30 uppercase font-mono">Start (s)</span>
                            <input
                                type="number"
                                step="0.1"
                                value={selectedClip.start}
                                onChange={(e) => updateClip(selectedClip.id, { start: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-white/30 uppercase font-mono">Duration (s)</span>
                            <input
                                type="number"
                                step="0.1"
                                value={selectedClip.duration}
                                onChange={(e) => updateClip(selectedClip.id, { duration: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Text Specific */}
                {!isMedia && (
                    <div className="space-y-4 pt-2">
                        <label className="text-xs font-medium text-white/60 flex items-center gap-2">
                            <Type className="w-3.5 h-3.5" /> Content
                        </label>
                        <textarea
                            value={textClip.text}
                            onChange={(e) => updateClip(selectedClip.id, { text: e.target.value })}
                            className="w-full h-24 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs focus:border-indigo-500 outline-none transition-colors resize-none"
                            placeholder="Enter text..."
                        />

                        <div className="space-y-3">
                            <span className="text-[10px] text-white/30 uppercase font-mono">Font Size</span>
                            <input
                                type="range"
                                min="10"
                                max="200"
                                value={textClip.style.fontSize}
                                onChange={(e) => updateClip(selectedClip.id, {
                                    style: { ...textClip.style, fontSize: parseInt(e.target.value) }
                                })}
                                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <span className="text-[10px] text-white/30 uppercase font-mono">Color</span>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={textClip.style.color}
                                    onChange={(e) => updateClip(selectedClip.id, {
                                        style: { ...textClip.style, color: e.target.value }
                                    })}
                                    className="w-8 h-8 rounded-md bg-transparent border-none cursor-pointer"
                                />
                                <span className="text-xs font-mono text-white/80 uppercase">{textClip.style.color}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Video Specific */}
                {selectedClip.type === 'video' && (
                    <div className="space-y-4 pt-2">
                        <label className="text-xs font-medium text-white/60 flex items-center gap-2">
                            <Play className="w-3.5 h-3.5" /> Source Offset
                        </label>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-white/30 uppercase font-mono">Start in File (s)</span>
                            <input
                                type="number"
                                step="0.1"
                                value={mediaClip.startTimeInFile}
                                onChange={(e) => updateClip(selectedClip.id, { startTimeInFile: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
