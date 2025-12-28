// Web Worker for Transcription (Static Version)
// This file is served as a static asset to bypass Next.js/Turbopack bundling issues.

let pipeline, env;
let transcriber = null;

async function loadLibrary() {
    if (pipeline) return;
    try {
        // Import transformers from CDN
        const module = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
        pipeline = module.pipeline;
        env = module.env;

        // Configuration
        env.allowLocalModels = false;
        env.allowRemoteModels = true;

        // Optimize for browser environment
        if (env.backends && env.backends.onnx) {
            env.backends.onnx.wasm.proxy = false;
        }
    } catch (err) {
        console.error('Worker: Failed to load transformers library:', err);
        throw err;
    }
}

async function getTranscriber(onProgress) {
    if (transcriber) return transcriber;

    await loadLibrary();

    transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
        progress_callback: onProgress
    });

    return transcriber;
}

self.onmessage = async (e) => {
    const { audioData } = e.data;

    try {
        const transcriber = await getTranscriber((p) => {
            self.postMessage({ type: 'progress', data: p });
        });

        const result = await transcriber(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
            return_timestamps: true,
        });

        // Split segments into smaller 2-3 word chunks
        const refinedChunks = [];
        for (const chunk of result.chunks) {
            const words = chunk.text.trim().split(/\s+/);
            const start = chunk.timestamp[0];
            const end = chunk.timestamp[1];
            const duration = end - start;

            if (words.length <= 3) {
                refinedChunks.push(chunk);
                continue;
            }

            const wordsPerChunk = 2;
            for (let i = 0; i < words.length; i += wordsPerChunk) {
                const chunkWords = words.slice(i, i + wordsPerChunk);
                const chunkStart = start + (i / words.length) * duration;
                const chunkEnd = start + (Math.min(i + wordsPerChunk, words.length) / words.length) * duration;

                refinedChunks.push({
                    text: chunkWords.join(' '),
                    timestamp: [chunkStart, chunkEnd]
                });
            }
        }

        self.postMessage({ type: 'result', data: refinedChunks });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        self.postMessage({ type: 'error', data: errorMsg });
    }
};
