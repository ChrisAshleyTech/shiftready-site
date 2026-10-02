# Run from the repo root: python3 scripts/intro-video/music.py (needs numpy) -> out/music.wav, 30 s.
# Soft ambient bed: slow pad chords plus a gentle plucked arpeggio, with a synthetic hall reverb.
import numpy as np, wave
SR = 44100; DUR = 30.0; N = int(SR * DUR); rng = np.random.default_rng(7)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
# D major: Dmaj9, Bm9, Gmaj9, A6/9 (MIDI), 3.75 s each, twice.
CH = [[50, 57, 62, 66, 69, 76], [47, 54, 62, 66, 69, 73], [43, 50, 59, 62, 66, 69], [45, 52, 61, 64, 66, 71]] * 2
L = DUR / len(CH)
t = np.arange(N) / SR
pad = np.zeros(N); pluck = np.zeros(N)
for i, ch in enumerate(CH):
    s, e = i * L, (i + 1) * L
    env = np.clip((t - s) / 1.6, 0, 1) * np.clip((e + 1.6 - t) / 1.6, 0, 1)
    env = np.sin(env * np.pi / 2) ** 2
    for m in ch:
        f = hz(m)
        for d in (-0.12, 0.12):
            pad += env * (np.sin(2 * np.pi * (f + d) * t + rng.uniform(0, 6)) + 0.18 * np.sin(4 * np.pi * (f + d) * t)) / len(ch)
    # Arpeggio: upper notes, one every half beat-ish, soft decay.
    arp = [ch[2], ch[3], ch[4], ch[5], ch[4], ch[3]]
    for k, m in enumerate(arp):
        st = s + k * L / len(arp); n0 = int(st * SR); n1 = min(N, n0 + int(2.5 * SR)); tt = np.arange(n1 - n0) / SR
        f = hz(m + 12)
        tone = (np.sin(2*np.pi*f*tt) + 0.35*np.sin(4*np.pi*f*tt) + 0.12*np.sin(6*np.pi*f*tt)) * np.exp(-2.6 * tt) * np.clip(tt / 0.008, 0, 1)
        pluck[n0:n1] += tone * 0.22
mix = pad * 0.5 + pluck
# Hall reverb: exponentially decaying noise impulse response, convolved with FFT.
ir_t = np.arange(int(2.8 * SR)) / SR
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / 0.75); ir[0] = 6
def conv(x): n = len(x) + len(ir); F = np.fft.rfft(x, n) * np.fft.rfft(ir, n); return np.fft.irfft(F, n)[:len(x)]
wetL, wetR = conv(mix), conv(np.roll(mix, 331))
# Gentle low-pass (one-pole) to keep it soft.
def lp(x, a=0.18):
    y = np.empty_like(x); acc = 0.0
    for i in range(0, len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
L_ = lp(0.55 * mix + 0.45 * wetL / np.abs(wetL).max() * np.abs(mix).max()); R_ = lp(0.55 * mix + 0.45 * wetR / np.abs(wetR).max() * np.abs(mix).max())
st = np.stack([L_, R_], 1)
fade = np.clip(t / 2.0, 0, 1) * np.clip((DUR - t) / 3.0, 0, 1)
st *= fade[:, None]; st = st / np.abs(st).max() * 0.7
w = wave.open("scripts/intro-video/out/music.wav", "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close()
print("ok")
