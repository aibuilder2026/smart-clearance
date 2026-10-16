"""SC-228 (SC-219 cut 17): the parts the cut adds.

- PngSeq: a transparent overlay rendered by Remotion (remo12/, src/fssai17/) as a PNG sequence, laid over a shot from
  its own start; it carries the sounds its moments make (the mix lays them from mix13.PAGE_SOUND).
- Defocus: a background held while the voice says FSSAI's rule over it: the godown's clip is 5.7 s and the rule is said
  after it ends, so its last frame is pushed in slowly, softened and dimmed under the rule's card, then brought back
  into focus before the camera rushes into the carton.
- TracePanel17: cut 6's production trace (Cloud Trace's waterfall), its 34 s played over a given time, for the record
  scene's shorter beat (cut 17 shares the record's line with the audit trail and the platform's board)."""
from functools import lru_cache
from pathlib import Path
import cv2
import numpy as np
from kit import *
from parts4 import _zoom
import parts6
from parts6 import TracePanel

# the trace's key names Gemini on Agent Platform, Vertex AI's new name (SC-220)
parts6.SVC['gemini'] = (parts6.SVC['gemini'][0], 'Gemini · Agent Platform')


class PngSeq:
    """a Remotion PNG sequence (premultiplied when loaded) over the shot, its first frame at the shot's u0"""
    def __init__(self, folder, u0=0.0, sounds=()):
        self.folder, self.u0, self.sounds = Path(folder), u0, list(sounds)
        # its frames once Remotion has rendered them (shots13.py writes the props they are rendered from first)
        self.files = sorted(p for p in self.folder.iterdir() if p.suffix == '.png') if self.folder.exists() else []

    @lru_cache(maxsize=4)
    def frame(self, k):
        img = cv2.imread(str(self.files[k]), cv2.IMREAD_UNCHANGED).astype(np.float32) / 255
        if img.shape[2] == 3: img = np.dstack([img, np.ones(img.shape[:2], np.float32)])
        img[..., :3] *= img[..., 3:4]
        return img

    def draw(self, f, u, L=None):
        k = int(round((u - self.u0) * FPS))
        if k < 0 or k >= len(self.files): return
        spr = self.frame(k)
        if spr[..., 3].max() <= 0.002: return
        blit(f, spr, 0, 0)


class Defocus:
    """the base drawn, then pushed in about pt (from u_push to u_end), blurred and dimmed from u_blur until u_clear"""
    def __init__(self, base, u_push, u_end, u_blur, u_clear, push=0.045, sigma=7.0, dim=0.34, pt=(W * 0.5, H * 0.46)):
        self.base, self.u_push, self.u_end, self.u_blur, self.u_clear = base, u_push, u_end, u_blur, u_clear
        self.push, self.sigma, self.dim, self.pt = push, sigma, dim, pt

    def draw(self, f, u, L=None):
        self.base.draw(f, u, L)
        z = 1 + self.push * ease_in_out(clamp((u - self.u_push) / max(0.1, self.u_end - self.u_push)))
        if z > 1.0004: f[:] = _zoom(f, z, self.pt)
        k = min(ease_in_out(clamp((u - self.u_blur) / 0.6)), ease_in_out(clamp((self.u_clear - u) / 0.5)))
        if k > 0.01:
            f[:] = cv2.GaussianBlur(f, (0, 0), self.sigma * k)
            f *= (1 - self.dim * k)


class TracePanel17(TracePanel):
    """the trace's waterfall played over `play` seconds (cut 6's over 3.6)"""
    def __init__(self, x, y, u0, u_play, u1, w=1000, play=2.0):
        self.k = 3.6 / play
        super().__init__(x, y, u0, u_play, u_play + (u1 - u_play) * self.k, w=w)

    def draw(self, f, u, L=None):
        super().draw(f, u if u < self.u_play else self.u_play + (u - self.u_play) * self.k, L)
