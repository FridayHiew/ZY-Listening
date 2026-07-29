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

      // Priority 1: Match target locale AND natural/enhanced/siri/google/neural voice keywords
      let matchedVoice = voices.find((v) => {
        const vLang = v.lang.replace('_', '-').toLowerCase();
        const vName = v.name.toLowerCase();
        const isLangMatch = vLang === targetLower || vLang.startsWith(langPrefix);
        const isPremium = vName.includes('natural') || vName.includes('siri') || vName.includes('enhanced') || vName.includes('premium') || vName.includes('online') || vName.includes('google') || vName.includes('neural') || vName.includes('wave');
        return isLangMatch && isPremium;
      });

      // Priority 2: Exact or prefix language code match
      if (!matchedVoice) {
        matchedVoice = voices.find((v) => {
          const vLang = v.lang.replace('_', '-').toLowerCase();
          return vLang === targetLower || vLang.startsWith(langPrefix);
        });
      }

      // Priority 3: Fallback per language for Mac/iOS/Android/Windows
      if (!matchedVoice && targetLang === 'en-GB') {
        matchedVoice = voices.find((v) => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return l.includes('en') || n.includes('uk') || n.includes('samantha') || n.includes('daniel') || n.includes('karen') || n.includes('serena');
        });
      }

      if (!matchedVoice && targetLang === 'ms-MY') {
        // Try Malay voices, or Indonesian (id-ID) as phonetic fallback (far superior to English voice)
        matchedVoice = voices.find((v) => {
          const l = v.lang.replace('_', '-').toLowerCase();
          const n = v.name.toLowerCase();
          return l.startsWith('ms') || n.includes('malay') || l.startsWith('id') || n.includes('indonesian');
        });
      }

      if (!matchedVoice && targetLang === 'zh-CN') {
        matchedVoice = voices.find((v) => {
          const l = v.lang.replace('_', '-').toLowerCase();
          const n = v.name.toLowerCase();
          return l.startsWith('zh') || n.includes('chinese') || n.includes('mandarin') || n.includes('tingting') || n.includes('sinji') || n.includes('xiaoxiao') || n.includes('meijia') || n.includes('huihui') || n.includes('yaoyao');
        });
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      }
    }

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Speak a vocabulary word using Hybrid Human Voice Engine
   * 1. Try Free Dictionary API for authentic English MP3 voice (when online)
   * 2. Try Google Translate Native TTS endpoint for Malay (ms) and Chinese (zh-CN) when online
   * 3. Fallback to optimized browser WebSpeech API (iOS Siri, Mac Safari, Chrome, Android, Edge)
   * Fully race-condition safe using token checks so multiple triggers never overlap.
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

    // 1. Attempt Free Dictionary Audio MP3 for English words when online
    if (langCode === 'en' && navigator.onLine && /^[a-zA-Z\s-]+$/.test(cleanText)) {
      try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanText.toLowerCase())}`);
        
        // Token check: abort if a newer speak request came in during fetch
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

    // 2. Online Google Translate Native TTS endpoint for Chinese, Malay, and English
    if (navigator.onLine) {
      let ttsTl = 'en-GB';
      if (langCode === 'zh') ttsTl = 'zh-CN';
      else if (langCode === 'ms') ttsTl = 'ms';

      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=${ttsTl}&client=tw-ob`;

      if (this.currentSpeechToken !== token) return;

      const audio = new Audio(ttsUrl);
      this.currentAudio = audio;
      audio.playbackRate = effectiveSpeed;

      let hasFallenBack = false;
      const doFallback = () => {
        if (hasFallenBack || this.currentSpeechToken !== token) return;
        hasFallenBack = true;
        this.speakWebSpeech(cleanText, targetLang, effectiveSpeed);
      };

      const timeoutId = setTimeout(() => {
        if (audio.readyState === 0) {
          try { audio.pause(); } catch {}
          doFallback();
        }
      }, 2500);

      audio.onerror = () => {
        clearTimeout(timeoutId);
        doFallback();
      };

      audio.onended = () => {
        clearTimeout(timeoutId);
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
      };

      try {
        await audio.play();
        clearTimeout(timeoutId);
        return;
      } catch {
        clearTimeout(timeoutId);
        doFallback();
        if (this.currentSpeechToken !== token) return;
      }
    }

    // Token check: abort before WebSpeech fallback
    if (this.currentSpeechToken !== token) return;

    // 3. Offline / Fallback: Browser WebSpeech API with strict language matching
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
