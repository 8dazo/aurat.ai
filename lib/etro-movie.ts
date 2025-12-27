import etro from 'etro';
import { Clip, MediaClip, TextClip, ZoomEffect } from './types';
import { useTimelineStore } from '../store/useTimelineStore';



export const createEtroMovie = (canvas: HTMLCanvasElement, clips: Clip[], zoomEffects: ZoomEffect[], movieDimensions: { width: number; height: number }) => {

    const movie = new etro.Movie({
        canvas,
    });
    movie.width = movieDimensions.width;
    movie.height = movieDimensions.height;

    clips.forEach((clip) => {
        if (clip.type === 'video' || clip.type === 'audio' || clip.type === 'image') {
            const mediaClip = clip as MediaClip;
            let layer;

            if (clip.type === 'video') {
                layer = new etro.layer.Video({
                    startTime: clip.start,
                    duration: clip.duration,
                    source: mediaClip.url,
                    sourceStartTime: clip.startTimeInFile,
                    width: movieDimensions.width,
                    height: movieDimensions.height,
                });
            } else if (clip.type === 'audio') {
                layer = new etro.layer.Audio({
                    startTime: clip.start,
                    duration: clip.duration,
                    source: mediaClip.url,
                    sourceStartTime: clip.startTimeInFile,
                });
            } else if (clip.type === 'image') {
                layer = new etro.layer.Image({
                    startTime: clip.start,
                    duration: clip.duration,
                    source: mediaClip.url,
                    width: movieDimensions.width,
                    height: movieDimensions.height,
                });
            }

            if (layer) {
                movie.addLayer(layer);
            }
        } else if (clip.type === 'text') {
            const textClip = clip as TextClip;
            const layer = new etro.layer.Text({
                startTime: textClip.start,
                duration: textClip.duration,
                text: textClip.text,
                x: textClip.style.position.x * movieDimensions.width,
                y: textClip.style.position.y * movieDimensions.height,
                fontSize: textClip.style.fontSize,
                fontFamily: textClip.style.fontFamily,
                color: textClip.style.color as any,
            } as any);
            movie.addLayer(layer);
        }
    });



    // Easing function for smooth transitions
    const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const DEFAULT_RECT = { x: 0, y: 0, width: 1, height: 1 };
    const TRANSITION_DURATION = 0.1; // 300ms

    // Add Zoom Effects
    movie.addEffect(new etro.effect.Transform({
        matrix: ((element: any, time: number) => {
            const liveZoomEffects = useTimelineStore.getState().zoomEffects;
            const matchingEffects = liveZoomEffects.filter((e) => time >= e.start && time <= e.start + e.duration);
            const effect = matchingEffects[matchingEffects.length - 1];

            let rect = DEFAULT_RECT;

            if (effect) {
                const targetRect = effect.rect;
                const timeInEffect = time - effect.start;
                const timeRemaining = (effect.start + effect.duration) - time;

                let progress = 1; // Full zoom

                if (timeInEffect < TRANSITION_DURATION) {
                    // Zooming in
                    progress = easeInOutCubic(timeInEffect / TRANSITION_DURATION);
                } else if (timeRemaining < TRANSITION_DURATION) {
                    // Zooming out
                    progress = easeInOutCubic(timeRemaining / TRANSITION_DURATION);
                }

                // Interpolate rect
                rect = {
                    x: DEFAULT_RECT.x + (targetRect.x - DEFAULT_RECT.x) * progress,
                    y: DEFAULT_RECT.y + (targetRect.y - DEFAULT_RECT.y) * progress,
                    width: DEFAULT_RECT.width + (targetRect.width - DEFAULT_RECT.width) * progress,
                    height: DEFAULT_RECT.height + (targetRect.height - DEFAULT_RECT.height) * progress,
                };
            }

            const matrix = new (etro.effect as any).Transform.Matrix();
            const { x, y, width: w, height: h } = rect;

            const sw = Math.max(0.001, w);
            const sh = Math.max(0.001, h);
            const scaleX = 1 / sw;
            const scaleY = 1 / sh;

            const width = movieDimensions.width;
            const height = movieDimensions.height;

            matrix.translate(-x * width, -y * height);
            matrix.scale(scaleX, scaleY);

            return matrix;
        }) as any
    }));


    return movie;
};
