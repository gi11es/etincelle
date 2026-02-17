import { pipeline, env, TextStreamer } from '../../zoe/ai/transformers.min.js';

env.allowLocalModels = false;
env.allowRemoteModels = true;

let generator = null;

const SYSTEM_PROMPT = `Tu es un assistant qui aide à rédiger des rapports de bugs pour "Étincelle", une appli web éducative familiale.
La page actuelle, le navigateur et une capture d'écran sont déjà collectés automatiquement.
Quand l'utilisateur décrit un problème :
1. Pose 1 à 2 questions courtes pour clarifier (que s'est-il passé exactement ? quel résultat attendais-tu ?)
2. Après avoir assez d'informations, produis un résumé structuré dans ce format exact :

**Titre:** [titre court du bug]
**Description:** [description claire du problème]
**Étapes:** [comment reproduire]

Sois concis et amical. Réponds toujours en français.`;

self.onmessage = async (e) => {
  const { type } = e.data;

  if (type === 'load') {
    try {
      self.postMessage({ type: 'progress', data: { status: 'initiate', name: 'model' } });
      generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', {
        dtype: 'q4',
        device: 'wasm',
        progress_callback: (p) => self.postMessage({ type: 'progress', data: p }),
      });
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
    }
  }

  if (type === 'chat') {
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...e.data.messages,
      ];

      let fullText = '';
      const streamer = new TextStreamer(generator.tokenizer, {
        skip_prompt: true,
        callback_function: (text) => {
          fullText += text;
          self.postMessage({ type: 'token', text });
        },
      });

      await generator(messages, {
        max_new_tokens: 300,
        temperature: 0.7,
        do_sample: true,
        streamer,
      });

      self.postMessage({ type: 'done', text: fullText });
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
    }
  }
};
