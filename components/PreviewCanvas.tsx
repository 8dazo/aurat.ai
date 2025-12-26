'use client';

import React, { useEffect, useRef } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { createEtroMovie } from '../lib/etro-movie';
import { Play, Pause, Square } from 'lucide-react';

export const PreviewCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const movieRef = useRef<any>(null);
    const clips = useTimelineStore((state) => state.clips);
    const currentTime = useTimelineStore((state) => state.currentTime);
    const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);
    const isPlaying = useTimelineStore((state) => state.isPlaying);
    const setIsPlaying = useTimelineStore((state) => state.setIsPlaying);
    const setDuration = useTimelineStore((state) => state.setDuration);

    // Initialize Etro Movie
    useEffect(() => {
        if (canvasRef.current && clips.length > 0) {
            movieRef.current = createEtroMovie(canvasRef.current, clips);

            // Update store duration
            const totalDuration = clips.reduce((acc, clip) => Math.max(acc, clip.start + clip.duration), 0);
            setDuration(totalDuration);
        }
    }, [clips, setDuration]);

    // Handle Playback State
    useEffect(() => {
        if (!movieRef.current) return;

        if (isPlaying) {
            movieRef.current.play();
        } else {
            movieRef.current.pause();
        }
    }, [isPlaying]);

    // Sync Current Time
    useEffect(() => {
        if (!movieRef.current || isPlaying) return;
        movieRef.current.currentTime = currentTime;
    }, [currentTime, isPlaying]);

    // Update store time during playback
    useEffect(() => {
        let raf: number;
        const update = () => {
            if (movieRef.current && isPlaying) {
                setCurrentTime(movieRef.current.currentTime);
            }
            raf = requestAnimationFrame(update);
        };
        raf = requestAnimationFrame(update);
        return () => cancelAnimationFrame(raf);
    }, [isPlaying, setCurrentTime]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="flex flex-col items-center gap-4 w-full max-w-4xl mx-auto">
            <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
                <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    className="w-full h-full object-contain"
                    onClick={togglePlay}
                />

                {/* Overlay Controls */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <button
                        className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center pointer-events-auto hover:bg-white/30 transition-all transform hover:scale-110"
                        onClick={togglePlay}
                    >
                        {isPlaying ? (
                            <Pause className="w-8 h-8 text-white fill-white" />
                        ) : (
                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                        )}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 p-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10">
                <button
                    onClick={() => {
                        setIsPlaying(false);
                        setCurrentTime(0);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <Square className="w-5 h-5 text-white/80 fill-white/80" />
                </button>
                <button
                    onClick={togglePlay}
                    className="p-3 bg-white text-black rounded-full hover:bg-white/90 transition-all transform active:scale-95"
                >
                    {isPlaying ? (
                        <Pause className="w-6 h-6 fill-black" />
                    ) : (
                        <Play className="w-6 h-6 fill-black ml-0.5" />
                    )}
                </button>
            </div>
        </div>
    );
};
