import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg } from './ffmpeg-export';
import { Caption } from './types';

export const extractAudio = async (file: File): Promise<Uint8Array> => {
    const ffmpeg = await getFFmpeg();
    const inputName = 'input_for_audio' + Math.random().toString(36).substring(7);
    const outputName = 'output.wav';

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Extract audio to 16kHz mono wav (required by Whisper)
    await ffmpeg.exec([
        '-i', inputName,
        '-ar', '16000',
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        outputName
    ]);

    const data = await ffmpeg.readFile(outputName);

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return data as Uint8Array;
};

export const transcribeVideo = async (
    file: File,
    onProgress: (status: string, progress: number) => void
): Promise<Caption[]> => {
    onProgress('Extracting audio...', 0);
    const audioData = await extractAudio(file);

    // Map Uint8Array to Float32Array
    const audioBuffer = new Int16Array(audioData.buffer);
    const float32Audio = new Float32Array(audioBuffer.length);
    for (let i = 0; i < audioBuffer.length; ++i) {
        float32Audio[i] = audioBuffer[i] / 32768.0;
    }

    return new Promise((resolve, reject) => {
        // Use static public path to bypass Turbopack
        const worker = new Worker('/transcription.worker.js', { type: 'module' });

        worker.onmessage = (e: MessageEvent) => {
            const { type, data } = e.data;

            if (type === 'progress') {
                if (data.status === 'progress') {
                    onProgress('Downloading model...', data.progress / 100);
                } else if (data.status === 'loading') {
                    onProgress('Loading model...', 0.5);
                } else if (data.status === 'ready') {
                    onProgress('Transcribing...', 1);
                }
            } else if (type === 'result') {
                const captions = data.map((chunk: any) => ({
                    id: Math.random().toString(36).substring(7),
                    start: chunk.timestamp[0],
                    end: chunk.timestamp[1],
                    text: chunk.text.trim(),
                }));
                worker.terminate();
                resolve(captions);
            } else if (type === 'error') {
                worker.terminate();
                reject(new Error(data));
            }
        };

        worker.onerror = (err) => {
            worker.terminate();
            reject(err);
        };

        worker.postMessage({ audioData: float32Audio });
    });
};
