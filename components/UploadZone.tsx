'use client';

import React, { useCallback } from 'react';
import { useTimelineStore } from '../store/useTimelineStore';
import { Upload } from 'lucide-react';

export const UploadZone = () => {
    const addClip = useTimelineStore((state) => state.addClip);
    const setSelectedClipId = useTimelineStore((state) => state.setSelectedClipId);

    const onFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const url = URL.createObjectURL(file);
                const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';

                // Get duration for video/audio
                let duration = 5; // Default for images
                if (type !== 'image') {
                    duration = await new Promise((resolve) => {
                        const el = document.createElement(type === 'video' ? 'video' : 'audio');
                        el.src = url;
                        el.onloadedmetadata = () => resolve(el.duration);
                    });
                }

                const newClipId = crypto.randomUUID();
                addClip({
                    id: newClipId,
                    type: type as any,
                    start: 0,
                    duration,
                    startTimeInFile: 0,
                    file,
                    url,
                    name: file.name,
                });
                setSelectedClipId(newClipId);
            }
        },
        [addClip, setSelectedClipId]
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
