import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Clip, MediaClip, TextClip, ZoomEffect } from './types';
import { createEtroMovie } from './etro-movie';
import { useTimelineStore } from '../store/useTimelineStore';
import { useCaptionStore } from '../store/useCaptionStore';

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
    zoomEffects: ZoomEffect[],
    onProgress: (progress: number) => void
) => {
    const ffmpeg = await getFFmpeg();
    const duration = clips.reduce((acc, clip) => Math.max(acc, clip.start + clip.duration), 0);
    if (duration === 0) throw new Error("Nothing to export");

    // Get movie dimensions from state
    const { movieDimensions } = useTimelineStore.getState();
    const { width: projectWidth, height: projectHeight } = movieDimensions;

    onProgress(5);

    // 1. Write all media files to ffmpeg FS
    const mediaClips = clips.filter(
        (c) => c.type === 'video' || c.type === 'audio' || c.type === 'image'
    ) as MediaClip[];
    const textClips = clips.filter((c: any) => c.type === 'text') as TextClip[];

    for (const clip of mediaClips) {
        await ffmpeg.writeFile(clip.name, await fetchFile(clip.file));
    }

    // Load a default font for text if needed
    if (textClips.length > 0) {
        try {
            const fontData = await fetchFile('https://github.com/google/fonts/raw/main/ofl/roboto/Roboto-Regular.ttf');
            await ffmpeg.writeFile('roboto.ttf', fontData);
        } catch (e) {
            console.error("Failed to load font, text might not render", e);
        }
    }
    onProgress(15);

    // 2. Build filter complex
    // Start with black base
    let filterComplex = `color=c=black:s=${projectWidth}x${projectHeight}:d=${duration}[base];`;
    let lastStream = '[base]';

    // Composition: Media Overlays
    mediaClips.forEach((clip, i) => {
        const streamName = `v${i}`;
        const outName = `ovv${i}`;
        filterComplex += `[${i + 1}:v]scale=${projectWidth}:${projectHeight}:force_original_aspect_ratio=decrease,pad=${projectWidth}:${projectHeight}:(ow-iw)/2:(oh-ih)/2[${streamName}];`;
        filterComplex += `${lastStream}[${streamName}]overlay=enable='between(t,${clip.start},${clip.start + clip.duration})'[${outName}];`;
        lastStream = `[${outName}]`;
    });

    // Composition: Text Overlays
    textClips.forEach((clip, i) => {
        const outName = `txv${i}`;
        // Map hex color to ffmpeg format if needed (ffmpeg supports hex)
        const color = clip.style.color || 'white';
        // Position is relative 0-1
        const xPos = clip.style.position.x * projectWidth;
        const yPos = clip.style.position.y * projectHeight;
        filterComplex += `${lastStream}drawtext=text='${clip.text}':fontfile=roboto.ttf:fontsize=${clip.style.fontSize}:fontcolor=${color}:x=${xPos}:y=${yPos}:enable='between(t,${clip.start},${clip.start + clip.duration})'[${outName}];`;
        lastStream = `[${outName}]`;
    });


    // Composition: Captions
    const { captions, isCaptionEnabled, captionPosition } = useCaptionStore.getState();
    if (isCaptionEnabled && captions.length > 0) {
        captions.forEach((cap: any, i: number) => {
            const outName = `capv${i}`;
            const fontSize = Math.round(projectHeight * 0.06);
            const boxPadding = Math.round(projectHeight * 0.02);
            const yPos = captionPosition === 'top'
                ? projectHeight * 0.15
                : projectHeight * 0.85;

            // Refined drawtext with background box and centered alignment
            filterComplex += `${lastStream}drawtext=text='${cap.text.replace(/'/g, "'\\\\''")}':fontfile=roboto.ttf:fontsize=${fontSize}:fontcolor=white:x=(w-text_w)/2:y=${yPos}-text_h:box=1:boxcolor=black@0.7:boxborderw=${boxPadding}:enable='between(t,${cap.start},${cap.end})'[${outName}];`;
            lastStream = `[${outName}]`;
        });
    }


    // 3. Zoom Segments
    // Find all discrete timing boundaries
    const boundaries = new Set<number>([0, duration]);
    zoomEffects.forEach(e => {
        boundaries.add(e.start);
        boundaries.add(e.start + e.duration);
    });
    const sortedPoints = Array.from(boundaries).sort((a, b) => a - b);

    let segments: string[] = [];
    const numSegments = sortedPoints.length - 1;

    // Split the final composition stream to use it in multiple segments
    filterComplex += `${lastStream}split=${numSegments}${Array.from({ length: numSegments }, (_, i) => `[s${i}]`).join('')};`;

    for (let i = 0; i < numSegments; i++) {
        const start = sortedPoints[i];
        const end = sortedPoints[i + 1];
        if (start === end) continue;

        const mid = (start + end) / 2;
        const matchingEffects = zoomEffects.filter(e => mid >= e.start && mid <= e.start + e.duration);
        const effect = matchingEffects[matchingEffects.length - 1]; // Priority to newer

        const segName = `seg${i}`;
        let zoomFilter = `trim=${start}:${end},setpts=PTS-STARTPTS`;

        if (effect) {
            const { x, y, width: w, height: h } = effect.rect;
            // Native FFmpeg crop
            zoomFilter += `,crop=${w}*iw:${h}*ih:${x}*iw:${y}*ih,scale=${projectWidth}:${projectHeight}`;
        } else {
            // Even if no zoom, we must trim to the correct time segment
            zoomFilter += `,scale=${projectWidth}:${projectHeight}`;
        }

        filterComplex += `[s${i}]${zoomFilter}[${segName}];`;
        segments.push(`[${segName}]`);
    }


    // 4. Concat all segments
    filterComplex += `${segments.join('')}concat=n=${segments.length}:v=1:a=0[vout]`;

    onProgress(25);

    // 5. Run FFmpeg
    const inputs = mediaClips.flatMap(c => ['-i', c.name]);
    ffmpeg.on('progress', ({ progress }: any) => {
        onProgress(25 + (progress * 75));
    });

    await ffmpeg.exec([
        '-f', 'lavfi', '-i', `color=c=black:s=${projectWidth}x${projectHeight}:d=${duration}`,
        ...inputs,
        '-filter_complex', filterComplex,
        '-map', '[vout]',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        'output.mp4'
    ]);

    const data = await ffmpeg.readFile('output.mp4');
    onProgress(100);

    return new Blob([data as any], { type: 'video/mp4' });
};
