import etro from 'etro';
import { Clip, MediaClip, TextClip } from './types';

export const createEtroMovie = (canvas: HTMLCanvasElement, clips: Clip[]) => {
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

    return movie;
};
