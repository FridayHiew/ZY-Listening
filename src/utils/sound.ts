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

  /**
   * Speak a vocabulary word using Web Speech API Synthesis
   * Uses Standard UK English (en-GB), Malaysia Malay (ms-MY), and China Chinese (zh-CN)
   * Supports speed options (1.0, 0.8, 0.6)
   */
  speak(text: string, langCode: 'en' | 'zh' | 'ms' = 'en', customSpeed?: number) {
    if (!('speechSynthesis' in window)) return;
    
    // Cancel ongoing speech
    window.speechSynthesis.cancel();
    
    // Clean text: strip HTML tags if any, or excessive symbols
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

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Target locale BCP-47 codes as requested:
    // Standard UK English: en-GB
    // Malaysia Malay: ms-MY
    // China Chinese: zh-CN
    let targetLang = 'en-GB';
    if (langCode === 'zh') {
      targetLang = 'zh-CN';
    } else if (langCode === 'ms') {
      targetLang = 'ms-MY';
    } else {
      targetLang = 'en-GB';
    }

    utterance.lang = targetLang;

    // Try finding exact or best matching voice in browser voice list
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const targetLower = targetLang.toLowerCase();

      let matchedVoice = voices.find((v) => {
        const vLang = v.lang.replace('_', '-').toLowerCase();
        return vLang === targetLower;
      });

      if (!matchedVoice && targetLang === 'en-GB') {
        // Fallback matching for UK English voices
        matchedVoice = voices.find((v) => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return l === 'en-gb' || l.includes('gb') || n.includes('uk') || n.includes('british') || n.includes('united kingdom');
        });
      }

      if (!matchedVoice && targetLang === 'ms-MY') {
        // Fallback matching for Malaysia Malay voices
        matchedVoice = voices.find((v) => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return l.startsWith('ms') || n.includes('malay') || n.includes('malaysia');
        });
      }

      if (!matchedVoice && targetLang === 'zh-CN') {
        // Fallback matching for China Chinese voices
        matchedVoice = voices.find((v) => {
          const l = v.lang.toLowerCase();
          const n = v.name.toLowerCase();
          return l === 'zh-cn' || l.includes('hans') || n.includes('chinese') || n.includes('mandarin') || n.includes('mainland');
        });
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }
    
    // Adjust volume & rate according to configured speech speed
    utterance.volume = 1.0;
    utterance.rate = effectiveSpeed;
    
    window.speechSynthesis.speak(utterance);
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
