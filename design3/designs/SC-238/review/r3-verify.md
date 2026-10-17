# r3: verification, SC-238 master (451.8 s)

Measured on all 27,109 frames: per-frame and per-region luma and differences, 0.5 s sheets, 1/60 s strips at every cut, phase-correlation motion, ebur128, Whisper. Black only in the 0.53 s head.

## r2's fixes

1. **Faces: FIXED.** The 0:19–0:23 distributor is the woman of 0:01, 4:38 and 7:10. The dawn lead matches her 4:00 close-up. The volunteer is off the lens (4:26.7–4:30.0), though she faces away from the driver.
2. **Gate: FIXED.** The doors part and the camera passes through, with no flash (2:51.9–2:52.15). **Coin: FIXED**, a real ₹.
3. **Cuts: FIXED** at 5:04, 6:49, 1:13.6, 4:12.75, and the 6:28 tick. **Papers' background: FIXED**, but each slide dissolves two see-through papers over two backgrounds (6:32.4, 6:33.9, 6:35.4, 6:36.0).
4. **Install scene: PARTLY.** The push moves, over a static gradient (1:51.6–2:00.5). **5:22 and 6:20 backgrounds: FIXED.** **Second certificate: FIXED** (the log).
5. **FIXED:** room tone at 0:07 (−35 to −38 dBFS), 6:26 and 6:28 (−37 dBFS), stop 1's chime, the shutter (5:53.19), the pop-outs' chimes, the music tail. **Orb dive: PARTLY.** Its faint whoosh comes 0.3–0.7 s early; the dive (2:16.0–2:16.45) and its cut are silent.

**Other r2 items:**
- FIXED: the Watcher chip, the kirana's invoice, the lead after "Approved", the repeats.
- PARTLY: the label glow is gone, but a grey fringe remains round back labels (3:37.2, 5:25.4).
- PARTLY: 22 of 73 cuts have no transient. 18 change room tone; 4 are silent (1:21.2, 2:16.47, 3:12.45, 3:45.4).
- STILL: the godown plate, used three times (0:11, 1:07, 1:14).

## New defects

1. **Stage leftovers and flicker.** The frame dims under the recording stage's green card "LIVE · The scheme fills" for 9 frames (4:23.550–4:23.683). Three screens flash, then its "STAFF SALE" card (4:24.433–4:24.500).
2. **One role, two faces.** The shopkeeper taking the van's carton (4:50.2–4:52.1, black hair) is not the man saying "The bill's inside? Good." (4:52.2–4:55.5, grey hair).
3. **The brand head looks into the lens** (3:58.0–3:58.4), after a rubbery, warping head bob (3:57.38–3:57.57).
4. **Compositing.**
   - A carton label sits on the staff man's jaw (4:39.7–4:40.1).
   - The UPI phone's patch shows rectangular seams round the bezel and thumb (4:38.3–4:39.4).
   - The buyer's white slip turns into a phone (5:39.2–5:39.35).
5. **Minor:**
   - the sliding day count runs through the axis labels (0:44.45–0:44.85);
   - a one-frame exposure drop (3:12.450, luma 57→43);
   - a 1.0 s whole-frame freeze (1:20.2–1:21.2);
   - the bin aerial repeats a frame every 6–15 frames (0:50.5–1:03.9);
   - whole-pixel drift on the credit note (6:15–6:17);
   - the kirana's bindi vanishes mid-turn (4:15.07);
   - a 3-frame certificate flash between signers (5:59.70).

## Audio

- −14.1 LUFS, LRA 6.4 LU, −1.5 dBTP.
- Pauses inside lines (median −29.7 dBFS) match the gaps between them (−28.4).
- Every line is audible: 48 of 60 read back at 0.85 or better; the rest differ only in numerals.
- 42 of 51 3D events show a clear onset; the rest are soft whooshes.

## Criteria

- Met: 1, 2, 3, 4, 5, 8, 9, the length, and 60 fps (no pull-down).
- Mostly met: 6, 7, 10, 13.
- Partly met: 11, 12.

## Verdict: ONE MORE PASS

1. Scan out 4:23.55–4:23.68 and 4:24.43–4:24.50.
2. One shopkeeper: re-render 4:52.2–4:55.5 from the van man's keyframe, or the reverse.
3. Brand head: trim the warp and end the line before 3:58.0, or retake it.
4. Mask the label off the staff man, feather the UPI patch, and cut the buyer's morph.
5. Add hits on the orb dive, 2:16.47, 1:21.2 and 3:45.4. Put motion under 1:20.2–1:21.2. Fix the 3:12.45 exposure step.
