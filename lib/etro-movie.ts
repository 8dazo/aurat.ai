import etro from 'etro';
import { Clip, MediaClip, TextClip, ZoomEffect } from './types';
import { useTimelineStore } from '../store/useTimelineStore';



export const createEtroMovie = (
    canvas: HTMLCanvasElement,
    clips: Clip[],
    zoomEffects: ZoomEffect[],
    movieDimensions: { width: number; height: number },
    captions: {
        items: any[];
        enabled: boolean;
        position: 'top' | 'bottom';
        config: any;
        currentTime: number;
    }
) => {

    const movie = new etro.Movie({
        canvas,
    });
    movie.width = movieDimensions.width;
    movie.height = movieDimensions.height;

    // Easing function for smooth transitions
    const easeInOutCubic = (t: number): number => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const DEFAULT_RECT = { x: 0, y: 0, width: 1, height: 1 };
    const TRANSITION_DURATION = 0.1;

    const createTransformEffect = () => new etro.effect.Transform({
        matrix: ((element: any, time: number) => {
            const liveZoomEffects = useTimelineStore.getState().zoomEffects;
            // time is relative to layer start, so add layer's startTime to get movie time
            const movieTime = (element.parent?.startTime || 0) + time;
            const matchingEffects = liveZoomEffects.filter((e) => movieTime >= e.start && movieTime <= e.start + e.duration);
            const effect = matchingEffects[matchingEffects.length - 1];

            let rect = DEFAULT_RECT;

            if (effect) {
                const targetRect = effect.rect;
                const timeInEffect = movieTime - effect.start;
                const timeRemaining = (effect.start + effect.duration) - movieTime;

                let progress = 1;

                if (timeInEffect < TRANSITION_DURATION) {
                    progress = easeInOutCubic(timeInEffect / TRANSITION_DURATION);
                } else if (timeRemaining < TRANSITION_DURATION) {
                    progress = easeInOutCubic(timeRemaining / TRANSITION_DURATION);
                }

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

            matrix.translate(-x * movieDimensions.width, -y * movieDimensions.height);
            matrix.scale(scaleX, scaleY);

            return matrix;
        }) as any
    });

    clips.forEach((clip) => {
        if (clip.type === 'video' || clip.type === 'audio' || clip.type === 'image') {
            const mediaClip = clip as MediaClip;
            let layer: any;

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
                if (clip.type === 'video' || clip.type === 'image') {
                    layer.addEffect(createTransformEffect());
                }
                movie.addLayer(layer);
            }
        } else if (clip.type === 'text') {
            const textClip = clip as TextClip;
            const layer = new etro.layer.Text({
                startTime: textClip.start,
                duration: textClip.duration,
                text: textClip.text,
                x: 0,
                y: 0,
                width: movieDimensions.width,
                height: movieDimensions.height,
                textX: textClip.style.position.x * movieDimensions.width,
                textY: textClip.style.position.y * movieDimensions.height,
                font: `${textClip.style.fontSize}px ${textClip.style.fontFamily}`,
                color: textClip.style.color as any,
                textAlign: 'center',
                textBaseline: 'middle',
                maxWidth: movieDimensions.width,
            } as any);
            movie.addLayer(layer);
        }
    });

    // Add Captions
    if (captions.enabled && captions.items.length > 0) {
        const { config, items, position } = captions;
        const baseWidth = 1280;
        const scaleFactor = movieDimensions.width / baseWidth;
        const fontSize = Math.max(16, Math.round(config.fontSize * scaleFactor));

        const layer = new etro.layer.Text({
            startTime: 0,
            duration: 3600, // Fixed long duration
            text: ((element: any, time: number) => {
                const active = items.find(c => time >= c.start && time <= c.end);
                return active ? active.text : '';
            }) as any,
            font: `${fontSize}px ${config.fontFamily}`,
            color: config.color as any,
            x: 0,
            y: 0,
            width: movieDimensions.width,
            height: movieDimensions.height,
            textX: movieDimensions.width / 2,
            textY: position === 'top' ? movieDimensions.height * 0.15 : movieDimensions.height * 0.85,
            textAlign: 'center',
            textBaseline: 'middle',
            maxWidth: movieDimensions.width * 0.9,
            opacity: ((element: any, time: number) => {
                const active = items.find(c => time >= c.start && time <= c.end);
                return active ? 1 : 0;
            }) as any,
        } as any);
        movie.addLayer(layer);
    }

    return movie;
};
