// All sound is synthesised in WebAudio: no audio files, no network. A tiny helper builds
// short oscillator blips and filtered noise bursts; each game sound is a few of those.
// The context is created lazily on the first user gesture, as browsers require.
export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.25;
      master.connect(context.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone({ type = 'sine', from = 440, to = null, at = 0, dur = 0.12, gain = 0.5 }) {
    if (!context || muted) return;
    const t0 = context.currentTime + at;
    const osc = context.createOscillator();
    const amp = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    if (to !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    amp.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise({ at = 0, dur = 0.15, gain = 0.4, freq = 800 }) {
    if (!context || muted) return;
    const t0 = context.currentTime + at;
    const length = Math.max(1, Math.floor(context.sampleRate * dur));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const amp = context.createGain();
    amp.gain.value = gain;
    source.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    source.start(t0);
  }

  return {
    /** Call from any user gesture so the browser lets sound play. */
    unlock() {
      if (ensure() && context.state === 'suspended') context.resume().catch(() => {});
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    /** Giblet's gobble: three fast low blips. */
    gobble() {
      if (!ensure()) return;
      tone({ type: 'square', from: 220, to: 160, dur: 0.07, gain: 0.25 });
      tone({ type: 'square', from: 260, to: 180, at: 0.08, dur: 0.07, gain: 0.25 });
      tone({ type: 'square', from: 300, to: 200, at: 0.16, dur: 0.09, gain: 0.22 });
    },
    jump() {
      if (!ensure()) return;
      tone({ type: 'sine', from: 280, to: 620, dur: 0.16, gain: 0.35 });
    },
    lane() {
      if (!ensure()) return;
      tone({ type: 'triangle', from: 500, to: 700, dur: 0.06, gain: 0.18 });
    },
    pickup() {
      if (!ensure()) return;
      tone({ type: 'sine', from: 880, to: 880, dur: 0.08, gain: 0.3 });
      tone({ type: 'sine', from: 1318, to: 1318, at: 0.08, dur: 0.12, gain: 0.3 });
    },
    hit() {
      if (!ensure()) return;
      noise({ dur: 0.22, gain: 0.5, freq: 500 });
      tone({ type: 'sawtooth', from: 160, to: 60, dur: 0.25, gain: 0.35 });
    },
    caught() {
      if (!ensure()) return;
      tone({ type: 'sawtooth', from: 392, to: 380, dur: 0.22, gain: 0.3 });
      tone({ type: 'sawtooth', from: 370, to: 360, at: 0.24, dur: 0.22, gain: 0.3 });
      tone({ type: 'sawtooth', from: 349, to: 330, at: 0.48, dur: 0.4, gain: 0.3 });
    },
    escaped() {
      if (!ensure()) return;
      const notes = [523, 659, 784, 1047];
      notes.forEach((n, i) => tone({ type: 'triangle', from: n, to: n, at: i * 0.13, dur: 0.18, gain: 0.35 }));
      tone({ type: 'triangle', from: 1319, to: 1319, at: 0.55, dur: 0.35, gain: 0.35 });
    },
  };
}
