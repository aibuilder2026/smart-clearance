"""SC-206: stills of a part at given local times, side by side, for checking.   .venv/bin/python still3.py brand 0.3 1.0 2.0 …"""
import sys, time
import cv2, numpy as np
from kit import W, H
import parts3, fx

def make(name):
    if name == 'brand': return parts3.BrandScene(t_strike=2.0, t_recovery=2.7, t_fly=3.6, t_teams=7.0, L=11.0)
    if name == 'result':
        import cv2 as _cv
        im = _cv.resize(_cv.imread('img/f-lakshmi.png'), (W, H)).astype('float32') / 255
        bg = _cv.GaussianBlur(im, (0, 0), 14) * 0.42
        return parts3.ResultPunch(0.0, 9.0, 'THE MANGO DRINK · THE RESULT', 'mango', 'MF-2410-118 · Lakshmi Agencies, Hyderabad',
            16917.10, -22657.20, 22194.30,
            [('52 kiranas', '1,372 packets · an invoice for every order', 1372, (52, 211, 128)),
             ('Staff sale', '150 packs · 18 UPI payments · ₹1,200', 150, (115, 201, 157)),
             ('Feeding India', '58 packs · 58 meals · receipt FI/HYD/26-27/0417', 58, (247, 192, 74))],
            [('Lakshmi Agencies ends whole · ₹0', 'good'), ('339.7 kg kept out of landfill', 'good'), ('Every paper signed', 'good')],
            [3.0, 3.6, 4.2], bg=bg)
    if name == 'papers':
        P_ = parts3.Paper
        inv = P_('chips-invoice-p0.png', [((36.4, 52, 300, 116), 'e-invoice: its IRN and signed QR', 'Registered on the Invoice Registration Portal as Rakesh issues it'),
                                          ((256, 506, 560, 556), '₹11,510 to Agrawal Wholesale', '772 packs at ₹14.20, IGST at 5%')], 0.0, 4.6)
        cert = P_('chips-destruction-p0.png', [((135, 190, 470, 206), '540 packs destroyed', 'Sanitary landfill, CPCB-compliant'),
                                                ((40, 455, 560, 600), 'Signed in place', 'The officer, two witnesses and Rakesh')], 4.6, 9.2)
        return parts3.PaperShow([inv, cert])
    if name == 'landfill25':
        base = parts3.Still25D('i3-landfill', z=(1.0, 1.10), pan=((0, 0), (-30, 6)), dur=4.0, focus=(0.55, 0.55))
        return parts3.Layered(base, [(fx.Dust(n=140, seed=7, color=(220, 210, 190), strength=0.45), 0.9)], vign=0.35)
    if name == 'upi':
        return parts3.UpiScene(t_lift=2.2, t_pay=3.4, t_paid=4.4, t_list=5.0, t_vision=8.5, lwin=None, L=10.0)
    if name == 'agenda': return parts3.Agenda([0.6, 2.2, 3.6], 7.0)
    if name.startswith('device'):
        from parts import Window
        mode = 'lift' if name.endswith('lift') else 'push'
        win = Window('mango', 'P', [(88.4, 98.2)], 700, 210, 1.0, 'munchly-smartclearance.web.app/command',
                     who=('Priya Deshmukh', 'Supply chain · Munchly Foods', 'priya'))
        face = parts3.Footage('f-priya'); ots = parts3.Footage('s-priya', hint=(1144, 572))
        d = parts3.DeviceShot(face, ots, win, t_whip=1.8, t_go=3.0, mode=mode, who=('Priya Deshmukh', 'Supply chain · Munchly Foods', 'p-priya'))
        class Both:
            def draw(self, f, u, L=None):
                d.draw(f, u, 9.0)
                if u > d.t_go + d.go_len: win.draw(f, u, 9.0)
        return Both()
    raise SystemExit('unknown part ' + name)

if __name__ == '__main__':
    name, out, ts = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3:]]
    part = make(name)
    tiles = []
    for t in ts:
        f = np.zeros((H, W, 3), np.float32)
        t0 = time.time(); part.draw(f, t, None)
        tiles.append(cv2.resize((np.clip(f, 0, 1) * 255).astype(np.uint8), (960, 540), interpolation=cv2.INTER_AREA))
        cv2.putText(tiles[-1], f'{t:.2f}s', (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        print(f'{t:.2f}s drawn in {time.time() - t0:.2f}s', flush=True)
    while len(tiles) % 2: tiles.append(np.zeros_like(tiles[0]))
    rows = [np.hstack(tiles[i:i + 2]) for i in range(0, len(tiles), 2)]
    cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
