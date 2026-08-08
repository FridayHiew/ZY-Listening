/**
 * Web Audio API Sound Synthesizer for Quiz/Exam Feedback
 * Self-contained, lightweight, and offline-compatible.
 */

import { loadAppState } from './storage';

class SoundEffects {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Play high-pitched rewarding chime for a correct answer in practice mode
   */
  playRightAnswer() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;

    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(523.25, now, 0.12); // C5
    playNote(659.25, now + 0.08, 0.22); // E5
  }

  /**
   * Play a prominent, low sawtooth double-pulse warning buzz for a wrong answer in practice mode
   */
  playWrongAnswer() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;

    const playBuzz = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.linearRampToValueAtTime(freq - 20, start + duration);

      // Clear, louder volume profile
      gain.gain.setValueAtTime(0.28, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      // Warm low-pass filter to keep it thick and solid without ear-piercing high frequencies
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, start);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // Dynamic double-beep warning buzz
    playBuzz(140, now, 0.15);
    playBuzz(120, now + 0.18, 0.22);
  }

  private currentAudio: HTMLAudioElement | null = null;
  private voicesLoaded: boolean = false;
  private currentSpeechToken: number = 0;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.voicesLoaded = true;
      };
    }
  }

  /**
   * Immediately cancel and stop all ongoing HTML audio and WebSpeech synthesis
   */
  stopAllSpeech() {
    this.currentSpeechToken++;
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  private speakWebSpeech(cleanText: string, targetLang: string, speed: number) {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = targetLang;
    utterance.volume = 1.0;
    utterance.rate = speed;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const targetLower = targetLang.toLowerCase();
      const langPrefix = targetLower.split('-')[0];

      // Check if user explicitly selected a preferred device voice for this language
      let preferredVoiceName: string | undefined;
      try {
        const state = loadAppState();
        if (langPrefix === 'en') preferredVoiceName = state.settings?.preferredVoiceEn;
        else if (langPrefix === 'zh') preferredVoiceName = state.settings?.preferredVoiceZh;
        else if (langPrefix === 'ms') preferredVoiceName = state.settings?.preferredVoiceMs;
      } catch {
        // ignore
      }

      let explicitVoice: SpeechSynthesisVoice | undefined;
      if (preferredVoiceName) {
        explicitVoice = voices.find((v) => v.name === preferredVoiceName || v.voiceURI === preferredVoiceName);
      }

      if (explicitVoice) {
        utterance.voice = explicitVoice;
        utterance.lang = explicitVoice.lang;
      } else {
        // Score voices to strictly prefer natural, neural, enhanced, and human voices
        // while avoiding legacy robotic desktop voices like Microsoft David / Zira / Mark
        const scoredVoices = voices.map((v) => {
          const vLang = v.lang.replace('_', '-').toLowerCase();
          const vName = v.name.toLowerCase();
          let score = 0;

          // Language matching
          if (vLang === targetLower) score += 60;
          else if (vLang.startsWith(langPrefix)) score += 40;
          else if (targetLang === 'ms-MY' && (vLang.startsWith('id') || vName.includes('indonesian'))) score += 15;
          else score -= 1000; // Wrong language

          // Neural / Natural / Premium voice detection
          if (vName.includes('online (natural)') || vName.includes('natural') || vName.includes('neural')) score += 100;
          if (vName.includes('enhanced') || vName.includes('premium') || vName.includes('siri')) score += 80;
          if (vName.includes('google')) score += 50;
          if (v.localService === false) score += 20;

          // High-quality voice names
          if (
            vName.includes('ava') ||
            vName.includes('jenny') ||
            vName.includes('aria') ||
            vName.includes('samantha') ||
            vName.includes('serena') ||
            vName.includes('daniel') ||
            vName.includes('karen') ||
            vName.includes('xiaoxiao') ||
            vName.includes('yunxi') ||
            vName.includes('xiaoyi') ||
            vName.includes('tingting') ||
            vName.includes('yasmin') ||
            vName.includes('osman')
          ) {
            score += 30;
          }

          // Heavy penalty for legacy robotic SAPI5 desktop voices
          if (vName.includes('david') || vName.includes('zira') || vName.includes('mark') || vName.includes('desktop') || vName.includes('speech')) {
            score -= 150;
          }

          return { voice: v, score };
        });

        scoredVoices.sort((a, b) => b.score - a.score);

        if (scoredVoices.length > 0 && scoredVoices[0].score > -500) {
          utterance.voice = scoredVoices[0].voice;
          utterance.lang = scoredVoices[0].voice.lang;
        }
      }
    }

    window.speechSynthesis.speak(utterance);
  }

  private isSupertonicAvailable: boolean | null = null;
  private lastSupertonicCheckTime = 0;

  /**
   * Supertonic 3 local on-device engine
   * Runs locally on http://127.0.0.1:7788
   */
  private async speakSupertonic3(cleanText: string, langCode: 'en' | 'zh', speed: number, token: number): Promise<boolean> {
    const now = Date.now();
    // If we checked Supertonic within the last 30 seconds and it failed, skip to avoid latency
    if (this.isSupertonicAvailable === false && now - this.lastSupertonicCheckTime < 30000) {
      return false;
    }

    return new Promise(async (resolve) => {
      try {
        const controller = new AbortController();
        const connectionTimer = setTimeout(() => controller.abort(), 350); // Fast 350ms connection check

        const response = await fetch('http://127.0.0.1:7788/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'supertonic-3',
            input: cleanText,
            voice: langCode === 'zh' ? 'F1' : 'Sarah',
            lang: langCode,
            speed: speed,
          }),
          signal: controller.signal,
        });

        clearTimeout(connectionTimer);
        this.isSupertonicAvailable = true;
        this.lastSupertonicCheckTime = now;

        if (this.currentSpeechToken !== token) {
          resolve(false);
          return;
        }

        if (response.ok) {
          const audioBlob = await response.blob();
          if (this.currentSpeechToken !== token) {
            resolve(false);
            return;
          }
          const success = await this.playAudioBlobChunks([audioBlob], token, speed);
          resolve(success);
        } else {
          resolve(false);
        }
      } catch {
        this.isSupertonicAvailable = false;
        this.lastSupertonicCheckTime = now;
        resolve(false);
      }
    });
  }

  /**
   * Microsoft Edge Neural TTS via WebSocket
   * Voice voices:
   *  - Malay (ms): ms-MY-YasminNeural
   *  - Chinese (zh): zh-CN-XiaoxiaoNeural
   *  - English (en): en-GB-SoniaNeural
   */
  private speakEdgeNeuralTTS(cleanText: string, langCode: 'en' | 'zh' | 'ms', speed: number, token: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (!navigator.onLine) {
        resolve(false);
        return;
      }

      let voiceName = 'en-US-AvaNeural';
      let lang = 'en-US';
      if (langCode === 'zh') {
        voiceName = 'zh-CN-YunxiNeural';
        lang = 'zh-CN';
      } else if (langCode === 'ms') {
        voiceName = 'ms-MY-YasminNeural';
        lang = 'ms-MY';
      }

      const percent = Math.round((speed - 1.0) * 100);
      const rateStr = `${percent >= 0 ? '+' : ''}${percent}%`;
      const escapedText = cleanText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      const requestId = Math.random().toString(36).substring(2, 15);
      const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EA634081836B92058988D4E1`;

      let ws: WebSocket | null = null;
      let resolved = false;
      const audioChunks: Blob[] = [];

      const cleanup = () => {
        if (ws) {
          try {
            ws.close();
          } catch {
            // ignore
          }
          ws = null;
        }
      };

      // Optimised timeout: 1500ms ensures that if the WebSocket is slow to connect or process, 
      // we fail fast and fall back to native speech, preventing a hanging 10s wait.
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }, 1500);

      try {
        ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
          if (this.currentSpeechToken !== token || resolved) {
            cleanup();
            return;
          }

          const configMsg = `Path: speech.config\r\nContent-Type: application/json; charset=utf-8\r\n\r\n{"context":{"synthesis":{"audio":{"metadataversion":"2020-05-01","version":"1.0.0","audioFormat":"audio-24khz-96kbitrate-mono-mp3","streamFormat":"audio-24khz-96kbitrate-mono-mp3"}}}}`;
          ws?.send(configMsg);

          const ssmlMsg = `Path: ssml\r\nContent-Type: application/ssml+xml\r\nX-RequestId: ${requestId}\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'><voice name='${voiceName}'><prosody pitch='+0Hz' rate='${rateStr}' volume='+0%'>${escapedText}</prosody></voice></speak>`;
          ws?.send(ssmlMsg);
        };

        ws.onmessage = (e) => {
          if (this.currentSpeechToken !== token || resolved) {
            cleanup();
            return;
          }

          if (typeof e.data === 'string') {
            if (e.data.includes('Path: turn.end')) {
              resolved = true;
              clearTimeout(timer);
              cleanup();
              if (audioChunks.length > 0) {
                this.playAudioBlobChunks(audioChunks, token).then(resolve);
              } else {
                resolve(false);
              }
            }
          } else if (e.data instanceof ArrayBuffer) {
            const view = new DataView(e.data);
            if (e.data.byteLength >= 2) {
              const headerLength = view.getUint16(0);
              if (e.data.byteLength >= 2 + headerLength) {
                const headerStr = new TextDecoder().decode(e.data.slice(2, 2 + headerLength));
                if (headerStr.includes('Path: audio')) {
                  const audioData = e.data.slice(2 + headerLength);
                  if (audioData.byteLength > 0) {
                    audioChunks.push(new Blob([audioData], { type: 'audio/mp3' }));
                  }
                }
              }
            }
          }
        };

        ws.onerror = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            cleanup();
            resolve(false);
          }
        };

        ws.onclose = () => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timer);
            if (audioChunks.length > 0 && this.currentSpeechToken === token) {
              this.playAudioBlobChunks(audioChunks, token, speed).then(resolve);
            } else {
              resolve(false);
            }
          }
        };
      } catch {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          cleanup();
          resolve(false);
        }
      }
    });
  }

  private async playAudioBlobChunks(chunks: Blob[], token: number, speed: number = 1.0): Promise<boolean> {
    if (this.currentSpeechToken !== token) return false;
    try {
      const audioBlob = new Blob(chunks, { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      if (speed && speed > 0) {
        audio.playbackRate = speed;
      }

      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (this.currentAudio === audio) this.currentAudio = null;
          resolve(true);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          if (this.currentAudio === audio) this.currentAudio = null;
          resolve(false);
        };
        audio.play().catch(() => resolve(false));
      });
    } catch {
      return false;
    }
  }

  /**
   * Speak a vocabulary word using Microsoft Edge Neural TTS + High Quality Fallbacks
   * 1. Primary: Microsoft Edge Neural TTS via direct WebSocket (ms-MY-YasminNeural, zh-CN-XiaoxiaoNeural, en-GB-SoniaNeural)
   * 2. Fallback: Free Dictionary API MP3 for English
   * 3. Fallback: Native Browser WebSpeech API with Microsoft/Neural voice auto-selection
   */
  async speak(text: string, langCode: 'en' | 'zh' | 'ms' = 'en', customSpeed?: number) {
    // Stop any active HTML audio or speech synthesis and increment token
    this.stopAllSpeech();
    const token = this.currentSpeechToken;

    const cleanText = text.replace(/["'”“]/g, '').trim();
    if (!cleanText) return;

    // Determine effective speed setting (1.0, 0.8, or 0.6)
    let effectiveSpeed = customSpeed;
    if (effectiveSpeed === undefined) {
      try {
        const state = loadAppState();
        effectiveSpeed = state.settings?.speechSpeed ?? 1.0;
      } catch {
        effectiveSpeed = 1.0;
      }
    }

    // Determine target locale BCP-47 codes
    let targetLang = 'en-GB';
    if (langCode === 'zh') {
      targetLang = 'zh-CN';
    } else if (langCode === 'ms') {
      targetLang = 'ms-MY';
    } else {
      targetLang = 'en-GB';
    }

    // Load setting to check if the user preferred native offline speech to bypass online delay
    let voiceMode = 'online';
    let useSupertonic3 = true;
    try {
      const state = loadAppState();
      voiceMode = state.settings?.voiceMode ?? 'online';
      useSupertonic3 = state.settings?.useSupertonic3 ?? true;
    } catch {
      // ignore
    }

    // 0. Try local Supertonic 3 engine first if enabled for English or Chinese
    if (useSupertonic3 && (langCode === 'en' || langCode === 'zh')) {
      const supertonicSuccess = await this.speakSupertonic3(cleanText, langCode, effectiveSpeed, token);
      if (supertonicSuccess || this.currentSpeechToken !== token) return;
    }

    if (voiceMode === 'online' && navigator.onLine) {
      // 1. Try Microsoft Edge Neural TTS via WebSocket
      const edgeSuccess = await this.speakEdgeNeuralTTS(cleanText, langCode, effectiveSpeed, token);
      if (edgeSuccess || this.currentSpeechToken !== token) return;

      // 2. Fallback: Free Dictionary Audio MP3 for single English words when online
      if (langCode === 'en' && !cleanText.includes(' ') && cleanText.length < 30 && /^[a-zA-Z-]+$/.test(cleanText)) {
        try {
          // Add 400ms AbortController timeout to prevent the dictionary fetch hanging
          const controller = new AbortController();
          const fetchTimer = setTimeout(() => controller.abort(), 400);

          const res = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanText.toLowerCase())}`,
            { signal: controller.signal }
          );
          clearTimeout(fetchTimer);
          
          if (this.currentSpeechToken !== token) return;

          if (res.ok) {
            const data = await res.json();
            let audioUrl = '';
            if (Array.isArray(data) && data.length > 0) {
              const phonetics = data[0].phonetics || [];
              const withAudio = phonetics.find((p: any) => p.audio && p.audio.trim().length > 0);
              if (withAudio) {
                audioUrl = withAudio.audio;
              }
            }

            if (audioUrl) {
              if (this.currentSpeechToken !== token) return;

              const audio = new Audio(audioUrl);
              this.currentAudio = audio;
              audio.playbackRate = effectiveSpeed;

              try {
                await audio.play();
                return;
              } catch {
                // Fallback if audio.play() fails
              }
            }
          }
        } catch {
          // Fallback
        }
      }
    }

    // Token check: abort before WebSpeech fallback
    if (this.currentSpeechToken !== token) return;

    // 3. Fallback: Browser WebSpeech API with Microsoft/Neural voice prioritization
    this.speakWebSpeech(cleanText, targetLang, effectiveSpeed);
  }

  /**
   * Play ascending bright major-chord fanfare for passing the exam
   */
  playPassExam() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;

    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(261.63, now, 0.35);        // C4
    playNote(329.63, now + 0.08, 0.35);  // E4
    playNote(392.00, now + 0.16, 0.35);  // G4
    playNote(523.25, now + 0.24, 0.55);  // C5
    playNote(659.25, now + 0.32, 0.75);  // E5
  }

  /**
   * Play descending melancholy chord for failing the exam
   */
  playFailedExam() {
    const ctx = this.init();
    if (!ctx) return;

    const now = ctx.currentTime;

    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(392.00, now, 0.35);        // G4
    playNote(311.13, now + 0.12, 0.35); // Eb4
    playNote(261.63, now + 0.24, 0.55);  // C4
  }
}

export const quizSounds = new SoundEffects();
