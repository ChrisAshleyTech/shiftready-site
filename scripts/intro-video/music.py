# Run from the repo root: python3 scripts/intro-video/music.py (needs numpy) -> out/music.wav, 30 s.
# Score in three parts, timed to the cut in build-intro.sh:
#   0-8.7 s   home and the commute: uneasy D minor pad with a rub, a low heartbeat pulse and a ticking pluck,
#             and a noise swell that rises into the office;
#   8.7-23.7  the office: the tension resolves to warm D major chords with a soft plucked arpeggio;
#   23.7-30   the door R and end card: a last open chord held under the closing line.
# All of it runs through a synthetic hall reverb and a gentle low-pass.
import numpy as np, wave
SR = 44100; DUR = 30.0; N = int(SR * DUR); rng = np.random.default_rng(7)
OFFICE = 8.7; END = 23.7
def hz(m): return 440 * 2 ** ((m - 69) / 12)
t = np.arange(N) / SR

def swell(s, e, fade=1.6):
    env = np.clip((t - s) / fade, 0, 1) * np.clip((e + fade - t) / fade, 0, 1)
    return np.sin(env * np.pi / 2) ** 2

def pad_chord(ch, s, e, fade=1.6, trem=0.0):
    out = np.zeros(N); env = swell(s, e, fade)
    if trem: env = env * (1 - trem * (0.5 + 0.5 * np.sin(2 * np.pi * 5.2 * t)))
    for m in ch:
        f = hz(m)
        for d in (-0.12, 0.12):
            out += env * (np.sin(2 * np.pi * (f + d) * t + rng.uniform(0, 6)) + 0.18 * np.sin(4 * np.pi * (f + d) * t)) / len(ch)
    return out

def note(buf, st, m, gain, decay=2.6, length=2.5):
    n0 = int(st * SR); n1 = min(N, n0 + int(length * SR))
    if n0 >= N: return
    tt = np.arange(n1 - n0) / SR; f = hz(m)
    tone = (np.sin(2*np.pi*f*tt) + 0.35*np.sin(4*np.pi*f*tt) + 0.12*np.sin(6*np.pi*f*tt)) * np.exp(-decay * tt) * np.clip(tt / 0.008, 0, 1)
    buf[n0:n1] += tone * gain

pad = np.zeros(N); pluck = np.zeros(N); low = np.zeros(N)

# Part 1, tension. Dm(add9) with Bb rubbing against A, then Bb/D with an E rub; a slight tremolo.
pad += pad_chord([38, 50, 57, 58, 65, 76], 0.0, 4.2, trem=0.25)
pad += pad_chord([38, 50, 58, 62, 64, 65], 4.35, OFFICE - 0.6, trem=0.3)
# Ticking: a muted high pluck on every half beat (100 bpm), a semitone apart, getting louder.
for k, st in enumerate(np.arange(0.6, OFFICE - 0.3, 0.3)):
    note(pluck, st, 74 if k % 2 == 0 else 75, 0.05 + 0.07 * st / OFFICE, decay=16, length=0.4)
# Heartbeat: a low "lub-dub" thump every beat.
for st in np.arange(0.6, OFFICE - 0.2, 0.6):
    for off, g in ((0, 1.0), (0.17, 0.6)):
        n0 = int((st + off) * SR); n1 = min(N, n0 + int(0.35 * SR)); tt = np.arange(n1 - n0) / SR
        low[n0:n1] += g * np.sin(2 * np.pi * (48 + 40 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 11) * (0.25 + 0.35 * st / OFFICE)
# Rising filtered-noise swell into the office, cut off where it opens up.
nz = rng.standard_normal(N); acc = 0.0; nl = np.empty(N)
for i in range(N): acc += 0.04 * (nz[i] - acc); nl[i] = acc
rise = np.clip((t - (OFFICE - 2.4)) / 2.4, 0, 1) ** 2 * (t < OFFICE + 0.15)
pad += nl / np.abs(nl).max() * rise * 0.35

# Part 2, the office: warm D major, Dmaj9, Bm9, Gmaj9, A6/9, with the arpeggio.
CH = [[50, 57, 62, 66, 69, 76], [47, 54, 62, 66, 69, 73], [43, 50, 59, 62, 66, 69], [45, 52, 61, 64, 66, 71]]
L = (END - OFFICE) / len(CH)
for i, ch in enumerate(CH):
    s = OFFICE + i * L
    pad += pad_chord(ch, s - (0.6 if i == 0 else 0), s + L, fade=1.2 if i == 0 else 1.6)
    arp = [ch[2], ch[3], ch[4], ch[5], ch[4], ch[3]] * 2
    for k, m in enumerate(arp):
        note(pluck, s + k * L / len(arp), m + 12, 0.16 + 0.06 * i)
    # A soft low root on each chord.
    note(low, s, ch[0] - 12, 0.5, decay=0.9, length=3.5)
# A bright accent where the tension breaks.
for k, m in enumerate([74, 78, 81, 86]):
    note(pluck, OFFICE + 0.04 * k, m, 0.2, decay=1.6, length=3)

# Part 3, the end card: Gmaj9 opening to a held Dmaj9 (add 6) under the closing line.
pad += pad_chord([43, 50, 59, 62, 66, 69, 74], END, END + 1.4, fade=1.0)
pad += pad_chord([38, 50, 57, 62, 66, 71, 76], END + 1.2, DUR, fade=1.4)
note(low, END + 1.2, 38, 0.6, decay=0.5, length=5)
for k, m in enumerate([74, 78, 81, 83, 86]):
    note(pluck, END + 1.2 + 0.5 * k, m + 12, 0.1, decay=1.4)

mix = pad * 0.5 + pluck + low * 0.8
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
fade = np.clip(t / 1.5, 0, 1) * np.clip((DUR - t) / 3.0, 0, 1)
st *= fade[:, None]; st = st / np.abs(st).max() * 0.7
w = wave.open("scripts/intro-video/out/music.wav", "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close()
print("ok")
