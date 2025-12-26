import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Clip, MediaClip } from './types';

let ffmpeg: FFmpeg | null = null;

export const getFFmpeg = async () => {
    if (ffmpeg) return ffmpeg;

    ffmpeg = new FFmpeg();

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpeg;
};

export const exportVideo = async (
    clips: Clip[],
    onProgress: (progress: number) => void
) => {
    const ffmpeg = await getFFmpeg();

    ffmpeg.on('progress', ({ progress }) => {
        onProgress(progress * 100);
    });

    // Write all media files to ffmpeg FS
    const mediaClips = clips.filter(
        (c) => c.type === 'video' || c.type === 'audio' || c.type === 'image'
    ) as MediaClip[];

    for (const clip of mediaClips) {
        await ffmpeg.writeFile(clip.name, await fetchFile(clip.file));
    }

    const inputName = mediaClips[0].name;
    const outputName = 'output.mp4';

    await ffmpeg.exec(['-i', inputName, '-c:v', 'libx264', '-preset', 'ultrafast', outputName]);

    const data = await ffmpeg.readFile(outputName);
    // Casting to any to avoid SharedArrayBuffer vs ArrayBuffer incompatibility in some TS environments
    return new Blob([data as any], { type: 'video/mp4' });
};
