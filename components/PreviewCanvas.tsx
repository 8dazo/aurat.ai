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
    const zoomEffects = useTimelineStore((state) => state.zoomEffects);


    // Initialize Etro Movie
    useEffect(() => {
        if (canvasRef.current && (clips.length > 0 || zoomEffects.length > 0)) {
            if (movieRef.current) {
                movieRef.current.pause();
                movieRef.current = null;
            }

            movieRef.current = createEtroMovie(canvasRef.current, clips, zoomEffects);
            movieRef.current.currentTime = currentTime;
            if (isPlaying) {
                movieRef.current.play();
            }

            // Update store duration
            const totalDuration = clips.reduce((acc, clip) => Math.max(acc, clip.start + clip.duration), 0);
            setDuration(totalDuration);
        }


        return () => {
            if (movieRef.current) {
                movieRef.current.pause();
            }
        };
    }, [clips, setDuration]); // Removed zoomEffects dependency



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
        if (!movieRef.current) return;

        const diff = Math.abs(movieRef.current.currentTime - currentTime);
        // Only sync if the difference is significant (manual seek)
        // This avoids feedback loops during normal playback
        if (diff > 0.1) {
            movieRef.current.currentTime = currentTime;
        }
    }, [currentTime]);

    // Force redraw when zoom effects change while paused
    useEffect(() => {
        if (!movieRef.current || isPlaying) return;
        // Pulse the time to trigger Etro's refresh logic
        const t = movieRef.current.currentTime;
        movieRef.current.currentTime = t;
    }, [zoomEffects, isPlaying]);


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
        <div className="flex flex-col items-center justify-center w-full h-full min-h-0 relative group">
            <div className="relative aspect-video max-h-full w-auto bg-black/40 backdrop-blur-sm rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
                <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={togglePlay}
                />

                {/* Overlay Controls - Centered */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} pointer-events-none`}>
                    <button
                        className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center pointer-events-auto hover:bg-white/20 hover:scale-110 active:scale-95 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePlay();
                        }}
                    >
                        {isPlaying ? (
                            <Pause className="w-8 h-8 text-white fill-white" />
                        ) : (
                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
