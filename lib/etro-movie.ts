import etro from 'etro';
import { Clip, MediaClip, TextClip, ZoomEffect } from './types';
import { useTimelineStore } from '../store/useTimelineStore';



export const createEtroMovie = (canvas: HTMLCanvasElement, clips: Clip[], zoomEffects: ZoomEffect[]) => {

    const movie = new etro.Movie({ canvas });

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
                x: textClip.style.position.x,
                y: textClip.style.position.y,
                fontSize: textClip.style.fontSize,
                fontFamily: textClip.style.fontFamily,
                color: textClip.style.color as any,
            } as any);
            movie.addLayer(layer);
        }
    });



    // Add Zoom Effects
    movie.addEffect(new etro.effect.Transform({
        matrix: ((element: any, time: number) => {
            // Read latest zoom effects directly from store to avoid stale closures and re-inits
            const liveZoomEffects = useTimelineStore.getState().zoomEffects;
            // Pick the last matching effect in case of overlaps (most recently added)
            const matchingEffects = liveZoomEffects.filter((e) => time >= e.start && time <= e.start + e.duration);
            const effect = matchingEffects[matchingEffects.length - 1];

            const matrix = new (etro.effect as any).Transform.Matrix();
            if (effect) {
                const { x, y, width: w, height: h } = effect.rect;

                const sw = Math.max(0.01, w);
                const sh = Math.max(0.01, h);
                const scaleX = 1 / sw;
                const scaleY = 1 / sh;

                const width = element.width || movie.width || 1280;
                const height = element.height || movie.height || 720;

                // Etro uses pre-multiplication (M_added * M_old)
                // We want v' = Scale * (v - offset)
                // 1. Move point to origin: matrix.translate(-offset)
                // 2. Scale it: matrix.scale(S)
                // Result: matrix.scale(S).multiply(matrix.translate(-offset)) -> S * T
                matrix.translate(-x * width, -y * height);
                matrix.scale(scaleX, scaleY);
            }
            return matrix;
        }) as any
    }));


    return movie;
};
