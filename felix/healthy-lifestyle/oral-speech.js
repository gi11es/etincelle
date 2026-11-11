// Local STT only. No API keys, audio uploads, or browser cloud-recognition fallback.
export class SpeechCoach {
  host = null;
  loading = null;
  epoch = 0;
  serial = 0;
  recorder = null;
  media = null;
  cancelRecording = null;
  get supported() { return window.isSecureContext && !!navigator.mediaDevices?.getUserMedia && !!window.MediaRecorder && window.crossOriginIsolated; }

  async prepare(onProgress = () => {}) {
    if (!this.supported) throw new Error('Ce navigateur ne peut pas ouvrir la reconnaissance locale. Utilise la page HTTPS dans un navigateur récent.');
    if (!this.loading) {
      this.loading = (async () => {
        const { SttWorkerHost } = await import('../../shared/vendor/moonshine-0.1.6/stt-worker-host.js');
        const { ModelArch } = await import('../../shared/vendor/moonshine-0.1.6/enums.js');
        this.host = new SttWorkerHost();
        this.host.onProgress = (_, loaded, total) => onProgress(total ? Math.round(loaded / total * 100) : null);
        await this.host.loadTranscriber({ transcriberId: 'oral-en', modelArch: ModelArch.SmallStreaming, source: { kind: 'catalog', language: 'en' } });
      })().catch(error => { this.host?.close(); this.host = null; this.loading = null; throw error; });
    }
    return this.loading;
  }

  async transcribe(blob) {
    await this.prepare();
    const context = new AudioContext({ sampleRate: 16000 });
    let samples;
    try {
      const decoded = await context.decodeAudioData(await blob.arrayBuffer());
      samples = new Float32Array(decoded.length);
      for (let channel = 0; channel < decoded.numberOfChannels; channel++) {
        const values = decoded.getChannelData(channel);
        for (let i = 0; i < samples.length; i++) samples[i] += values[i] / decoded.numberOfChannels;
      }
    } finally { await context.close(); }
    const energy = samples.reduce((sum, value) => sum + value * value, 0) / Math.max(1, samples.length);
    if (energy < 1e-7) return '';
    const id = `answer-${++this.serial}`;
    const lines = new Map();
    let failure;
    await this.host.createStream('oral-en', id);
    const update = ({ line }) => { lines.set(line.id, line.text); };
    this.host.setListener(id, { onLineStarted: update, onLineUpdated: update, onLineTextChanged: update, onLineCompleted: update, onError: event => { failure = event.error; } });
    try {
      await this.host.start(id);
      for (let offset = 0; offset < samples.length; offset += 16000) this.host.addAudio(id, samples.subarray(offset, offset + 16000), 16000, { transcribe: false });
      await this.host.stop(id);
      if (failure) throw failure;
      return [...lines.values()].join(' ').trim();
    } finally { await this.host.closeStream(id); }
  }

  async record({ maxMs = 20000, onState, onProgress }) {
    await this.cancel();
    const epoch = ++this.epoch;
    onState('loading');
    await this.prepare(onProgress);
    if (epoch !== this.epoch) throw new DOMException('Recording cancelled', 'AbortError');
    const media = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    if (epoch !== this.epoch) { media.getTracks().forEach(track => track.stop()); throw new DOMException('Recording cancelled', 'AbortError'); }
    this.media = media;
    let recorder;
    try { recorder = this.recorder = new MediaRecorder(media); }
    catch (error) { media.getTracks().forEach(track => track.stop()); this.media = null; throw error; }
    const chunks = [];
    let timeout;
    let blob;
    try {
      blob = await new Promise((resolve, reject) => {
        this.cancelRecording = () => reject(new DOMException('Recording cancelled', 'AbortError'));
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = () => reject(new Error('L’enregistrement a été interrompu. Réessaie.'));
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
        recorder.start(); onState('recording');
        timeout = setTimeout(() => this.finish(), maxMs);
      });
    } finally {
      clearTimeout(timeout);
      media.getTracks().forEach(track => track.stop());
      if (this.recorder === recorder) { this.recorder = null; this.media = null; this.cancelRecording = null; }
    }
    if (epoch !== this.epoch) throw new DOMException('Recording cancelled', 'AbortError');
    onState('processing');
    const text = await this.transcribe(blob);
    if (epoch !== this.epoch) throw new DOMException('Recording cancelled', 'AbortError');
    return { text, blob };
  }
  finish() { if (this.recorder?.state === 'recording') this.recorder.stop(); }
  async cancel() {
    this.epoch++;
    this.cancelRecording?.();
    this.finish();
    this.media?.getTracks().forEach(track => track.stop());
  }
  close() { this.cancel(); this.host?.close(); this.host = null; this.loading = null; }
}
