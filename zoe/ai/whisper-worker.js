import { pipeline, env } from './transformers.min.js';

env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = './';

let transcriber = null;

self.onmessage = async (e) => {
  const { type } = e.data;

  if (type === 'load') {
    const progressCb = (p) => self.postMessage({ type: 'progress', data: p });

    // Multi-threaded WASM with q8 quantization
    // (WebGPU disabled — known to produce gibberish with Whisper encoder-decoders)
    try {
      transcriber = await pipeline('automatic-speech-recognition', 'whisper-small', {
        progress_callback: progressCb,
        dtype: 'q8',
      });
      self.postMessage({ type: 'ready', backend: 'wasm' });
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
    }
  }

  if (type === 'transcribe') {
    try {
      const result = await transcriber(e.data.audio, {
        language: e.data.language || 'french',
        task: 'transcribe',
      });
      self.postMessage({ type: 'result', text: result.text });
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
    }
  }
};
