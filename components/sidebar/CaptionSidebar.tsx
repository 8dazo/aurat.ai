'use client';

import React, { useState } from 'react';
import { useTimelineStore } from '@/store/useTimelineStore';
import { useCaptionStore } from '@/store/useCaptionStore';
import { SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { Languages, Play, Settings, Type, Trash2, Check, Layout, AlignCenter, AlignJustify, AlertCircle } from 'lucide-react';
import { transcribeVideo } from '@/lib/transcription';
import { cn } from '@/lib/utils';
import { MediaClip } from '@/lib/types';

export const CaptionSidebar = () => {
    const clips = useTimelineStore((state) => state.clips);
    const {
        captions,
        setCaptions,
        isCaptionEnabled,
        setIsCaptionEnabled,
        captionPosition,
        setCaptionPosition,
        lastInvalidatedAt
    } = useCaptionStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [processStatus, setProcessStatus] = useState('');
    const [processProgress, setProcessProgress] = useState(0);

    const handleProcessVideo = async () => {
        const videoClips = clips
            .filter(c => c.type === 'video')
            .sort((a, b) => a.start - b.start) as MediaClip[];

        if (videoClips.length === 0) {
            alert('Please add a video to the timeline first.');
            return;
        }

        try {
            setIsProcessing(true);
            let allCaptions = [];

            for (let i = 0; i < videoClips.length; i++) {
                const clip = videoClips[i];
                setProcessStatus(`Transcribing segment ${i + 1}/${videoClips.length}...`);

                const results = await transcribeVideo(
                    clip.file,
                    (status, progress) => {
                        // Blend current segment progress with overall progress
                        const overallProgress = (i + progress) / videoClips.length;
                        setProcessProgress(overallProgress);
                    },
                    clip.startTimeInFile,
                    clip.duration
                );

                // Offset caption timestamps to match timeline
                const offsetResults = results.map(cap => ({
                    ...cap,
                    start: cap.start + clip.start,
                    end: cap.end + clip.start,
                    clipId: clip.id
                }));

                allCaptions.push(...offsetResults);
            }

            setCaptions(allCaptions);
            setIsCaptionEnabled(true);
        } catch (error) {
            console.error('Transcription failed:', error);
            alert('Transcription failed. Check console for details.');
        } finally {
            setIsProcessing(false);
            setProcessStatus('');
            setProcessProgress(0);
        }
    };

    return (
        <div className="flex flex-col h-full bg-sidebar">
            <SidebarHeader className="border-b border-sidebar-border p-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                        Captions
                    </span>
                    <Languages className="w-4 h-4 text-muted-foreground/50" />
                </div>
            </SidebarHeader>

            <SidebarContent className="p-4 space-y-6">
                {/* Invalidation Notice */}
                {lastInvalidatedAt && captions.length === 0 && (
                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-[11px] font-medium text-orange-200 leading-tight">Timeline Changed</p>
                            <p className="text-[10px] text-orange-300/80 leading-normal">
                                Captions were removed to stay in sync with your new edits. Please re-generate them.
                            </p>
                        </div>
                    </div>
                )}

                {/* Process Button */}
                <div className="space-y-4">
                    <button
                        onClick={handleProcessVideo}
                        disabled={isProcessing}
                        className={cn(
                            "w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all",
                            isProcessing
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                        )}
                    >
                        {isProcessing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                <span>Auto Caption</span>
                            </>
                        )}
                    </button>

                    {isProcessing && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-mono">
                                <span>{processStatus}</span>
                                <span>{Math.round(processProgress * 100)}%</span>
                            </div>
                            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${processProgress * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {captions.length > 0 && (
                    <>
                        {/* Settings */}
                        <div className="space-y-4 border-t border-sidebar-border pt-4">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <Settings className="w-3.5 h-3.5" /> Settings
                            </label>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-foreground/80">Enable Captions</span>
                                    <button
                                        onClick={() => setIsCaptionEnabled(!isCaptionEnabled)}
                                        className={cn(
                                            "w-8 h-4 rounded-full transition-colors relative",
                                            isCaptionEnabled ? "bg-primary" : "bg-muted"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                                            isCaptionEnabled ? "left-4.5" : "left-0.5"
                                        )} />
                                    </button>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <span className="text-[10px] text-muted-foreground/60 uppercase font-mono">Position</span>
                                    <div className="flex gap-2">
                                        {(['top', 'bottom'] as const).map((pos) => (
                                            <button
                                                key={pos}
                                                onClick={() => setCaptionPosition(pos)}
                                                className={cn(
                                                    "flex-1 py-2 rounded-md text-xs border transition-all flex items-center justify-center gap-2",
                                                    captionPosition === pos
                                                        ? "bg-primary/10 border-primary text-primary"
                                                        : "bg-muted/50 border-sidebar-border text-muted-foreground hover:bg-muted"
                                                )}
                                            >
                                                {pos === 'top' ? <Layout className="w-3 h-3 rotate-180" /> : <Layout className="w-3 h-3" />}
                                                <span className="capitalize">{pos}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Caption List */}
                        <div className="space-y-4 border-t border-sidebar-border pt-4">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <Type className="w-3.5 h-3.5" /> Generated ({captions.length})
                            </label>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {captions.map((cap: any) => (
                                    <div key={cap.id} className="p-2 rounded-lg bg-muted/30 border border-sidebar-border group hover:border-primary/30 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[9px] font-mono text-muted-foreground">
                                                {cap.start.toFixed(2)}s - {cap.end.toFixed(2)}s
                                            </span>
                                            <button
                                                onClick={() => setCaptions(captions.filter((c: any) => c.id !== cap.id))}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-foreground/90 leading-snug">{cap.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {captions.length === 0 && !isProcessing && (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 text-muted-foreground/40">
                        <Type className="w-12 h-12 stroke-[1]" />
                        <p className="text-[10px] max-w-[150px]">Click the button above to automatically generate captions from your video.</p>
                    </div>
                )}
            </SidebarContent>
        </div>
    );
};
