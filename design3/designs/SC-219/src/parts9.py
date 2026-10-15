"""SC-219 cut 9: the parts cut 9 adds to cut 8's (parts … parts8).

- EndCard9: cut 8's close with the guided demo's QR code in a column of its own at the right, clear of the line: the
  mark, the name, the line, the addresses, the stack and the sign-ins move left to make room (the maintainer's note).
- TrackList: what the Command Center tracks for every batch, a row lit as the voice names it.
"""
import numpy as np
from kit import *
from parts import words_sprite, url_line, studio
from parts3 import text_sprite
from parts4 import Kinetic, Orbit, _zoom, MarkDraw
from parts5 import qr_sprite, ink_left
from parts6 import access_line, icon_sprite, kicker_sprite
from parts7 import panel, TX, ICON, G, MUTED, INK
from parts4 import _dot
from parts8 import circle_ring


class EndCard9:
    """The close (cut 9): the mark draws its route; the name slides out from behind it; the line lands word by word with
    the voice; the four addresses, the stack and where the sign-ins and the sample data are; and the guided demo's QR
    code, in its own column at the right, as the voice names it. Everything left hangs from one edge (X)."""
    MX, X = 236, 384                      # the mark's centre; the text column's left edge (cut 8: 420, 560)
    URL_AT, URL_STEP, FOOT_AT = 1.6, 0.1, 2.0
    QX, QY, QS = 1526, 338, 300           # the code's column: clear of the line, which ends near x 1400

    def __init__(self, L, words, t_access, t_demo):
        self.L, self.t_access, self.t_demo = L, t_access, t_demo
        self.mark = MarkDraw(self.MX, 372, 176, 0.25)
        self.name = words_sprite(head='Smart-Clearance', width=1100, hsize=96)
        self.name_dx = ink_left(self.name)
        self.line = Kinetic(0, 470, [words], size=40, kind='g', wght=620, rgb=(200, 222, 210))
        dx = ink_left(text_sprite(words[0][0], 'g', 40, 620, (200, 222, 210)))
        for i, (s, x, y, t) in enumerate(self.line.words):
            self.line.words[i] = (s, x + self.X - dx, y, t)
        self.urls = [url_line(*x) for x in [('smartclearance.web.app', 'the platform'), ('smartclearance-console.web.app', 'the console'),
                                             ('munchly-smartclearance.web.app', "a client's workspace"), ('smartclearance-demo.web.app', 'the guided demo')]]
        self.url_dx = ink_left(self.urls[0])
        self.foot = words_sprite(kicker='BUILT ON GEMINI · GOOGLE ADK · CLOUD RUN · FIREBASE · GOOGLE AI HACKATHON 2026', width=1500)
        self.foot_dx = ink_left(self.foot)
        self.access = [access_line('shield-check', 'Sign-ins for the live app on Google Cloud', 'in our deck'),
                       access_line('package', 'Sample data to run the demo', 'github.com/aibuilder2026/smart-clearance')]
        self.qr = qr_sprite(self.QS)
        self.qr_k = words_sprite(kicker='TRY THE GUIDED DEMO', width=420)
        self.qr_u = TX('smartclearance-demo.web.app', 'g', 19, 560, (200, 222, 210))
        self.bg = None

    def draw(self, f, u, L=None):
        if self.bg is None:
            o = Orbit().frame(700)
            self.bg = cv2.GaussianBlur(o.astype(np.float32) / 255, (0, 0), 9) * 0.3 + studio() * 0.7
        f[:] = _zoom(self.bg, 1 + 0.05 * ease_in_out(u / max(1e-3, self.L)), (W / 2, H / 2))
        self.mark.draw(f, u)
        e = ease_out((u - 0.85) / 0.7)
        if e > 0:
            spr = self.name; h, w = spr.shape[:2]
            x_end = self.X - self.name_dx; x = self.MX + (x_end - self.MX) * e
            vis = int(clamp(x + w - (self.MX + 90), 0, w))       # nothing shows left of the mark's right edge
            cut = w - vis
            if vis > 0: blit(f, spr[:, cut:], x + cut, 304, clamp((u - 0.85) / 0.3))
        self.line.draw(f, u)
        for i, s_ in enumerate(self.urls):
            t0 = self.URL_AT + i * self.URL_STEP
            a = clamp((u - t0) / 0.4)
            if a > 0: blit(f, s_, self.X - self.url_dx + (i % 2) * 470, 590 + (i // 2) * 76 + 10 * (1 - ease_out((u - t0) / 0.5)), a)
        a = clamp((u - self.FOOT_AT) / 0.6)
        if a > 0: blit(f, self.foot, self.X - self.foot_dx, 774, a)
        for i, s_ in enumerate(self.access):
            t0 = max(self.t_access[i], self.FOOT_AT + 0.3 + 0.5 * i)
            a = clamp((u - t0) / 0.4)
            if a > 0: blit(f, s_, self.X - 6, 836 + i * 64 + 10 * (1 - ease_out((u - t0) / 0.5)), a)
        # the guided demo: its own column at the right, the kicker over the code and the address under it
        a = clamp((u - self.t_demo) / 0.4)
        if a > 0:
            e = ease_out((u - self.t_demo) / 0.6)
            blit(f, self.qr_k, self.QX, self.QY - 50, a)
            blit(f, self.qr, self.QX, self.QY + 14 * (1 - e), a)
            blit(f, self.qr_u, self.QX, self.QY + self.QS + 22 + 14 * (1 - e), a)


class TrackList:
    """What the Command Center tracks, for every batch, every morning: a row each, lit as the voice names it (cut 9, the
    maintainer's note: show how Supply Chain tracks the batches at risk from the Command Center)."""
    ROWS = [('hourglass', 'Days left', 'to each batch’s best-before'),
            ('trending-down', 'Sell-through', 'at today’s pace, from BigQuery'),
            ('shield', 'Quick-commerce gates', 'Blinkit, Zepto and Instamart'),
            ('trash-2', 'The cost of the bin', 'stock, disposal, EPR, GST reversed')]

    def __init__(self, x, y, w, times, u0, u1, title='THE COMMAND CENTER · EVERY BATCH, EVERY MORNING'):
        self.x, self.y, self.w, self.times, self.u0, self.u1 = x, y, w, times, u0, u1
        self.title = kicker_sprite(title, (232, 242, 236), 15)
        self.rows = [(icon_sprite(i, 22), TX(t, 'g', 21, 650, INK), TX(s, 'g', 16, 480, MUTED)) for i, t, s in self.ROWS]
        self.tick = ICON('circle-check', 22, G)
        self.h = 60 + len(self.rows) * 74

    def draw(self, f, u, L=None):
        a = fade(u, self.u0, self.u1, 0.35, 0.3)
        if a <= 0: return
        x, y, w = self.x, self.y + 10 * (1 - ease_out((u - self.u0) / 0.5)), self.w
        panel(f, x, y, x + w, y + self.h, a, alpha=0.86)
        blit(f, self.title, x + 22, y + 18, a)
        for i, (ic, tt, ss) in enumerate(self.rows):
            t = self.times[i]
            lit = clamp((u - t) / 0.25)
            ra = a * (0.38 + 0.62 * lit)
            cy = y + 60 + i * 74 + 30
            cx = x + 22 + 21
            _dot(f, (cx, cy), 21, (14, 60, 43), ra, glow=0.1, core=(14, 60, 43))
            circle_ring(f, cx, cy, 21, G, ra * (0.45 + 0.55 * lit), 2.0)
            q = (u - t) / 0.7
            if 0 <= q < 1: circle_ring(f, cx, cy, 21 + 15 * ease_out(q), G, (1 - q) * 0.8 * a, 2.0)
            blit(f, ic, cx - 11, cy - 11, ra)
            dx = 12 * (1 - ease_out(clamp((u - t) / 0.4)))
            blit(f, tt, cx + 37 + dx * lit, cy - 24, ra)
            blit(f, ss, cx + 37 + dx * lit, cy + 2, ra * 0.95)
            if lit > 0: blit(f, self.tick, x + w - 44, cy - 11, a * lit)
