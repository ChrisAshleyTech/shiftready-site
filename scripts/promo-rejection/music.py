# Original music and sound effects for the promo, made in code (no licence to track) -> out/music.wav.
# 0-4.6 s: muted minor pad and inbox pings. 4.6-6.6 s: riser. 6.6-23.2 s: upbeat 120 bpm groove.
# 23.2 s on: bright held chord for the end card. Run from the repo root (needs numpy).
import numpy as np, wave
SR = 44100; DUR = 28.6; N = int(SR * DUR); t = np.arange(N) / SR; rng = np.random.default_rng(3)
L = np.zeros(N); R = np.zeros(N)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def put(x, at, gain=1.0, pan=0.0):
    n0 = int(at * SR); n1 = min(N, n0 + len(x)); x = x[: n1 - n0] * gain
    L[n0:n1] += x * (1 - pan) ; R[n0:n1] += x * (1 + pan)
def env(n, a=0.005, d=0.3):
    tt = np.arange(n) / SR; return np.clip(tt / a, 0, 1) * np.exp(-tt / d)
def tone(f, dur, a=0.005, d=0.3, harm=(1, .3, .1)):
    n = int(dur * SR); tt = np.arange(n) / SR
    return sum(h * np.sin(2 * np.pi * f * (k + 1) * tt) for k, h in enumerate(harm)) * env(n, a, d)
# Inbox pings (four emails landing).
for at in (0.3, 0.7, 1.1, 1.5):
    put(tone(hz(88), .5, d=.12, harm=(1, .2)) + tone(hz(81), .5, d=.18, harm=(1, .2)) * .6, at, .25)
# Muted A minor pad.
for m in (45, 57, 60, 64, 67):
    n = int(4.9 * SR); tt = np.arange(n) / SR; e = np.clip(tt / .8, 0, 1) * np.clip((4.9 - tt) / .6, 0, 1)
    put((np.sin(2 * np.pi * hz(m) * tt) + .15 * np.sin(4 * np.pi * hz(m) * tt)) * e, 0, .07)
# Riser 4.6-6.6: filtered noise swell plus a rising sine.
n = int(2.0 * SR); tt = np.arange(n) / SR; sw = (tt / 2.0) ** 2
noise = np.convolve(rng.standard_normal(n), np.ones(6) / 6, "same")
put(noise * sw * .18 + np.sin(2 * np.pi * np.cumsum(200 + 900 * sw) / SR) * sw * .12, 4.6)
# Groove: 120 bpm from 6.6 s to 23.2 s. C - G - Am - F, one bar each.
B = .5; START = 6.6; END = 23.2
CH = [(48, [60, 64, 67, 72]), (43, [59, 62, 67, 71]), (45, [60, 64, 69, 72]), (41, [60, 65, 69, 72])]
kick = lambda: np.sin(2 * np.pi * np.cumsum(np.linspace(140, 45, int(.25 * SR))) / SR) * env(int(.25 * SR), .001, .09)
def clap():
    n = int(.2 * SR); return np.convolve(rng.standard_normal(n), [1, -1], "same") * env(n, .001, .05)
def hat():
    n = int(.06 * SR); x = rng.standard_normal(n); return np.diff(x, prepend=0) * env(n, .001, .015)
beat = 0
while START + beat * B < END - .01:
    at = START + beat * B; bar = beat // 4; root, ch = CH[bar % 4]
    put(kick(), at, .55)
    if beat % 4 in (1, 3): put(clap(), at, .22)
    put(hat(), at + B / 2, .12, .3)
    put(tone(hz(root), B * .9, .004, .16, (1, .5, .2)), at, .22)               # bass
    put(tone(hz(root + 12), B * .45, .004, .08, (1, .5, .2)), at + B / 2, .12)  # octave bounce
    for k2 in range(2):                                                          # plucked arpeggio, 8ths
        m = ch[(beat * 2 + k2) % 4] + 12
        put(tone(hz(m), .4, .003, .12, (1, .35, .1)), at + k2 * B / 2, .07, .25 if k2 else -.25)
    if beat % 4 == 0:
        for m in ch: put(tone(hz(m), 4 * B, .02, .9, (1, .2)), at, .035)
    beat += 1
# Success chime when the grade lands (13.6 s).
for i, m in enumerate((72, 76, 79, 84)): put(tone(hz(m), .8, .002, .3), 13.6 + i * .07, .1)
# End card: bright held C major chord, slow fade.
for m in (48, 60, 64, 67, 71, 76):
    n = int((DUR - 23.2) * SR); tt = np.arange(n) / SR; e = np.clip(tt / .05, 0, 1) * np.exp(-tt / 2.6)
    put((np.sin(2 * np.pi * hz(m) * tt) + .2 * np.sin(4 * np.pi * hz(m) * tt)) * e, 23.2, .09)
put(kick(), 23.2, .6)
# Light reverb and master.
ir_t = np.arange(int(1.6 * SR)) / SR; ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t / .35); ir[0] = 0
def rev(x): n = len(x) + len(ir); return np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[:len(x)]
wl, wr = rev(L), rev(R); L += wl / np.abs(wl).max() * np.abs(L).max() * .18; R += wr / np.abs(wr).max() * np.abs(R).max() * .18
st = np.stack([L, R], 1); st *= np.clip((DUR - t) / 1.5, 0, 1)[:, None]; st = np.tanh(st / np.abs(st).max() * 1.2) * .8
w = wave.open("scripts/promo-rejection/out/music.wav", "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close(); print("music ok")
