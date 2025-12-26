'use client';

import React, { useState } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { exportVideo } from '../lib/ffmpeg-export';
import { Download, Loader2 } from 'lucide-react';

export const ExportButton = () => {
    const clips = useTimelineStore((state) => state.clips);
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleExport = async () => {
        if (clips.length === 0) return;

        setIsExporting(true);
        setProgress(0);

        try {
            const blob = await exportVideo(clips, (p) => setProgress(p));
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `video-export-${new Date().getTime()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Check console for details.');
        } finally {
            setIsExporting(false);
            setProgress(0);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={handleExport}
                disabled={isExporting || clips.length === 0}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg ${isExporting || clips.length === 0
                        ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 hover:shadow-indigo-500/30'
                    }`}
            >
                {isExporting ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Exporting {progress.toFixed(0)}%</span>
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        <span>Export Video</span>
                    </>
                )}
            </button>

            {isExporting && (
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
};
