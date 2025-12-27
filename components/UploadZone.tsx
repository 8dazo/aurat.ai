'use client';

import React, { useCallback } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { Upload } from 'lucide-react';

export const UploadZone = () => {
    const addClip = useTimelineStore((state) => state.addClip);
    const setSelectedClipId = useTimelineStore((state) => state.setSelectedClipId);

    const setMovieDimensions = useTimelineStore((state) => state.setMovieDimensions);

    const onFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files) return;

            const currentClips = useTimelineStore.getState().clips;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const url = URL.createObjectURL(file);
                const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';

                // Get duration and dimensions
                let duration = 5; // Default for images
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

                // If this is the first video/image, set the project dimensions
                if (currentClips.length === 0 && (type === 'video' || type === 'image') && width > 0 && height > 0) {
                    setMovieDimensions({ width, height });
                }

                const newClipId = crypto.randomUUID();
                addClip({
                    id: newClipId,
                    type: type as any,
                    trackId: '', // Will be assigned by store
                    start: 0,
                    duration,
                    startTimeInFile: 0,
                    file,
                    url,
                    name: file.name,
                    width: width || undefined,
                    height: height || undefined,
                });
                setSelectedClipId(newClipId);
            }
        },
        [addClip, setSelectedClipId, setMovieDimensions]
    );

    return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 rounded-xl bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all cursor-pointer relative group">
            <input
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                onChange={onFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload className="w-12 h-12 mb-4 text-white/50 group-hover:text-white/80 transition-colors" />
            <p className="text-white/80 font-medium">Drop clips here or click to browse</p>
            <p className="text-white/40 text-sm mt-2">Supports MP4, WebM, MP3, PNG, JPG</p>
        </div>
    );
};
