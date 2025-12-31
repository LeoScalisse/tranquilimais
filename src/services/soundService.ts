let masterVolume = 0.5;
let audioContext: AudioContext | null = null;

export const setMasterVolume = (volume: number) => {
  masterVolume = Math.max(0, Math.min(1, volume));
};

const initAudio = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

type SoundType = 'select' | 'confirm' | 'error' | 'toggle' | 'match' | 'click' | 'win' | 'victory' | 'send';

export const playSound = (type: SoundType) => {
  if (masterVolume === 0) return;

  const ctx = initAudio();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  
  const now = ctx.currentTime;

  switch (type) {
    case 'select':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, now);
      gainNode.gain.linearRampToValueAtTime(0.1 * masterVolume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      break;
    case 'confirm':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.1 * masterVolume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      break;
    case 'error':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, now);
      gainNode.gain.linearRampToValueAtTime(0.08 * masterVolume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      break;
    case 'toggle':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, now);
      gainNode.gain.linearRampToValueAtTime(0.05 * masterVolume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      break;
    case 'match':
      oscillator.type = 'sine';
      gainNode.gain.linearRampToValueAtTime(0.15 * masterVolume, now + 0.01);
      oscillator.frequency.setValueAtTime(783.99, now);
      oscillator.frequency.setValueAtTime(1046.50, now + 0.08);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      break;
    case 'click':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(1800, now);
      gainNode.gain.linearRampToValueAtTime(0.1 * masterVolume, now + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      break;
    case 'win':
      oscillator.type = 'sine';
      gainNode.gain.linearRampToValueAtTime(0.15 * masterVolume, now + 0.01);
      [440, 554.37, 659.25, 880].forEach((f, i) => {
        oscillator.frequency.setValueAtTime(f, now + i * 0.1);
      });
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      break;
    case 'victory':
      oscillator.type = 'sine';
      gainNode.gain.linearRampToValueAtTime(0.2 * masterVolume, now + 0.01);
      [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((f, i) => {
        oscillator.frequency.setValueAtTime(f, now + i * 0.1);
      });
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      break;
    case 'send':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(500, now);
      oscillator.frequency.linearRampToValueAtTime(700, now + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.08 * masterVolume, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      break;
  }

  oscillator.start(now);
  oscillator.stop(now + 2.0);
};
