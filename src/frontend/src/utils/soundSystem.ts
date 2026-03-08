export const SOUND_OPTIONS = [
  { id: "beep1", label: "Beep (short)", freq: 880, duration: 0.1 },
  { id: "beep2", label: "Beep (long)", freq: 660, duration: 0.3 },
  { id: "buzz1", label: "Buzz (error)", freq: 200, duration: 0.2 },
  { id: "buzz2", label: "Buzz (low)", freq: 150, duration: 0.4 },
  { id: "click1", label: "Click", freq: 1200, duration: 0.05 },
  { id: "chime1", label: "Chime", freq: 1047, duration: 0.4 },
];

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
  }
  return audioCtx;
};

export function playSound(soundId: string, volume: number): void {
  const sound = SOUND_OPTIONS.find((s) => s.id === soundId);
  if (!sound) return;

  try {
    const ctx = getAudioContext();
    // Resume if suspended (browser policy)
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = sound.freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, volume)),
      ctx.currentTime + 0.005,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + sound.duration,
    );
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + sound.duration + 0.01);
  } catch {
    // Ignore audio errors
  }
}
