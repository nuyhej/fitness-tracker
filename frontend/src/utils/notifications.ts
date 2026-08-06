// Web Audio API & Smart Mobile Notification System for ⚡ 찐fit

class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Play an uplifting C major arpeggio for Garmin/InBody sync success
  public playSyncSuccessChime() {
    const audio = this.getContext();
    if (!audio) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = audio.currentTime;

    notes.forEach((freq, index) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);

      gain.gain.setValueAtTime(0, now + index * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, now + index * 0.1 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(audio.destination);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.45);
    });
  }

  // Play a triumphant fanfare for 16-hour fasting completion
  public playFastingVictorySound() {
    const audio = this.getContext();
    if (!audio) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 fanfare
    const durations = [0.15, 0.15, 0.15, 0.6];
    let timeOffset = audio.currentTime;

    notes.forEach((freq, index) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();

      osc.type = 'triangle'; // Richer harmonics for fanfare
      osc.frequency.setValueAtTime(freq, timeOffset);

      gain.gain.setValueAtTime(0, timeOffset);
      gain.gain.linearRampToValueAtTime(0.25, timeOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + durations[index] + 0.1);

      osc.connect(gain);
      gain.connect(audio.destination);

      osc.start(timeOffset);
      osc.stop(timeOffset + durations[index] + 0.15);
      timeOffset += durations[index] * 0.9;
    });
  }
}

export const soundEngine = new SoundEngine();

export async function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      } catch (e) {
        console.error('Notification permission request error:', e);
      }
    }
    return Notification.permission === 'granted';
  }
  return false;
}

export function sendMobileNotification(title: string, body: string) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'jjin-fit-notification',
        });
      } catch (err) {
        console.error('Mobile push notification display error:', err);
      }
    }
  }
}
