/**
 * Shared Speech-to-Text service.
 * Primary: Whisper (via Web Worker + ONNX Runtime).
 * Fallback: Web Speech API (SpeechRecognition).
 *
 * Usage:
 *   import STT from '../../shared/stt-service.js';
 *   STT.init('english', onProgress);   // start loading model
 *   const text = await STT.listen(4000); // record & transcribe
 */

const WORKER_URL = '/zoe/ai/whisper-worker.js';

class STTService {
  constructor() {
    this._worker = null;
    this._ready = false;
    this._loading = false;
    this._language = 'english';
    this._resultCb = null;
    this._errorCb = null;
  }

  get isReady() { return this._ready; }
  get isLoading() { return this._loading; }

  /** Load the Whisper model in a Web Worker. Non-blocking, call early. */
  init(language = 'english', onProgress = null) {
    this._language = language;
    if (this._ready || this._loading) return this._loadPromise;

    this._loading = true;
    this._loadPromise = new Promise((resolve) => {
      try {
        this._worker = new Worker(WORKER_URL, { type: 'module' });
      } catch (e) {
        console.warn('STT: Worker creation failed:', e);
        this._loading = false;
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        console.warn('STT: Whisper load timed out (120s)');
        this._loading = false;
        resolve(false);
      }, 120000);

      this._worker.onmessage = (e) => {
        const { type } = e.data;
        if (type === 'progress' && onProgress) onProgress(e.data.data);
        if (type === 'ready') {
          clearTimeout(timeout);
          this._ready = true;
          this._loading = false;
          console.log('STT: Whisper ready');
          resolve(true);
        }
        if (type === 'result' && this._resultCb) {
          this._resultCb(e.data.text);
          this._resultCb = null;
          this._errorCb = null;
        }
        if (type === 'error') {
          if (this._errorCb) {
            this._errorCb(new Error(e.data.message));
            this._resultCb = null;
            this._errorCb = null;
          } else {
            clearTimeout(timeout);
            console.warn('STT: Whisper load error:', e.data.message);
            this._loading = false;
            resolve(false);
          }
        }
      };

      this._worker.postMessage({ type: 'load' });
    });

    return this._loadPromise;
  }

  /**
   * Record from microphone and return transcription text.
   * Uses Whisper if loaded, otherwise Web Speech API.
   * @param {number} maxMs — max recording duration (default 4000)
   * @param {function} onRecording — called when recording starts
   * @param {function} onProcessing — called when processing starts
   * @returns {Promise<string>} transcribed text (empty string on failure)
   */
  async listen(maxMs = 4000, onRecording = null, onProcessing = null) {
    if (this._ready && this._worker) {
      return this._listenWhisper(maxMs, onRecording, onProcessing);
    }
    return this._listenWebSpeech(maxMs, onRecording);
  }

  async _listenWhisper(maxMs, onRecording, onProcessing) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    try {
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);

      const audioReady = new Promise((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start();
      if (onRecording) onRecording();

      // Auto-stop after maxMs
      await new Promise((r) => setTimeout(r, maxMs));
      if (recorder.state === 'recording') recorder.stop();
      await audioReady;

      if (onProcessing) onProcessing();

      // Decode to 16 kHz Float32Array (Whisper requirement)
      const blob = new Blob(chunks, { type: recorder.mimeType });
      const arrayBuffer = await blob.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const float32 = audioBuffer.getChannelData(0);
      audioCtx.close();

      // Send to Whisper worker
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this._resultCb = null;
          this._errorCb = null;
          resolve('');
        }, 30000);

        this._resultCb = (text) => { clearTimeout(timeout); resolve(text); };
        this._errorCb = () => { clearTimeout(timeout); resolve(''); };

        this._worker.postMessage(
          { type: 'transcribe', audio: float32, language: this._language },
          [float32.buffer]
        );
      });
    } finally {
      stream.getTracks().forEach((t) => t.stop());
    }
  }

  _listenWebSpeech(maxMs, onRecording) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return Promise.resolve('');

    return new Promise((resolve) => {
      const recognition = new SpeechRecognition();
      recognition.lang = this._language === 'english' ? 'en-US' : 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      let resolved = false;
      const done = (text) => { if (!resolved) { resolved = true; resolve(text); } };

      recognition.onresult = (event) => done(event.results[0][0].transcript);
      recognition.onerror = () => done('');
      recognition.onend = () => done('');

      recognition.start();
      if (onRecording) onRecording();

      setTimeout(() => {
        try { recognition.stop(); } catch (_) { /* ignore */ }
      }, maxMs);
    });
  }
}

export default new STTService();
