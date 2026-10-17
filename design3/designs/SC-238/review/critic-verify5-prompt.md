You are an independent critic in a Gauntlet loop; you did NOT build this. Judge rendered pixels and measurable audio,
not intentions.

Artifact: {ARTIFACT} ({DURATION} s, the master: 1920 × 1080 at 60 fps, every clip interpolated to 60 fps, with the
film's final mix). It is the landing page's demo film for Smart-Clearance, agentic software that routes an FMCG brand's
near-expiry stock to kiranas, staff sales, food banks and a near-expiry marketplace instead of the bin, told as a short
film.

The previous verification: /Users/arundutta/projects/smart-clearance/design3/designs/SC-238/review/r4-verify.md (on the
470.42 s master). Timings have moved by under a second; find each item by its picture, not its old timestamp.

The maintainer's four notes (r4 judged 1 to 3 PARTLY, 4 FIXED). Check each again:
1. "some scenes have some background noise and hissing sound": no scene should hiss. Measure every shot's noise floor,
   the 6 to 14 kHz band above all, in the gaps between words, under the room tones and inside the people's own words
   (r4: the kirana owner's words carried a continuous band only 19 dB under their 0 to 1.5 kHz; the volunteer's 26 dB).
2. "The scenes where the user is talking to the camera, they must look at the camera": the kirana owner, the food bank
   volunteer, the shopkeeper, the wholesale buyer and the distributor at the landfill ("All four signatures. It's on
   record.") look into the lens through their whole line; the two phone calls, the lead's answer ("Not one pack.
   Approved.") and the brand's head who asks her ("Nothing to the bin.") are a conversation, off the lens.
3. "The destruction process signing and photo taking seems to be gone, I need that in a cinematic way and no
   hallucinations, distributor filming the disposal process and uploading": the landfill sequence (from "On expiry
   day"). One distributor throughout (the same face, hair, glasses and shirt in the wide, over the shoulder and his
   line); the photo he takes in the app's camera is the photo that uploads (the pit with the slate, after the cover);
   the officer and the witnesses signing on his tablet with the app's own sign sheets; the certificate's window gone
   before the cut to his face, with a sound; the send and Vision's checks. Look for anything invented or impossible: a
   hand through a tablet, a morphing carton or packet, garbled lettering, a face that changes, a screen that does not
   match its pop-out.
4. "The wholesaler buying scene, seems like he is shouting": still calm?

Then r4's five ranked fixes, each FIXED / PARTLY / STILL PRESENT with timestamps: 1. the bin aerial's judder (r4: two
near-still frames in every seven, 0:55 to 1:04); 2. the certificate window's last 3 frames over his close-up; 3. the
kirana's hiss; 4. the landfill's continuity (the photo, the distributor, his eyes); 5. the UPI patch's edges (about
4:38) and the brand head on the lens (about 3:57). And r4's minor list: the near-holds every 5th frame in his line, the
2:3 cadence on the brand head, the hitch every 15 frames in the agents scene (about 3:04.7 to 3:06.2, a held shot over
the town's footage), the volunteer's "pack", the late sound on the cut into the window closing (about 5:43.6), the
install scene's background (about 1:52), the godown plate.

Since r4, two bugs were found and fixed, so measure motion everywhere, not only where r4 did:
- every generated clip and talking take retimed to its shot (nearly all of them) had fallen back from Apple's
  VideoToolbox to RIFE, whose cadence (a copied frame, then a jump) r3 and r4 measured; all are now made by
  VideoToolbox. Measure judder on every clip and every talking face: repeated frames in motion, a 2:3 or 5-frame
  cadence, steps that alternate.
- the 3D agents scene's floor footage repeated one frame and skipped the next at 98 of its 5,144 frames.

The client's criteria (mandatory): 1. draw on the four-minute working demo; 2. no hand seen through the tablet at the
landfill; 3. papers not tilted; 4. pointers on the right place; 5. FSSAI's guidelines in detail; 6. professional scene
transitions; 7. sound effects all over, no blank portion of any screen; 8. the agentic flow standing out in 3D; 9. the
screen people watch matches its pop-out; 10. every scene with video or motion, blurred backgrounds video too;
11. realistic talking characters, like a short film; 12. no glitchy, blurry transitions; 13. backgrounds like the papers
scene: video under a green overlay that tells a story. Also: the whole journey; smooth (60 fps, never laggy); 450 to
480 seconds. The film's own words name no client; the app's screens show a fictional sample workspace.

Method: extract frames yourself with ffmpeg (contact sheets every 0.5 s, native frames at key moments, dense 1/60 s
strips around every cut and transition), compute frame differences and optical flow for frozen stretches and for
judder (repeated frames in motion), scan for black frames, measure the audio with ebur128 and band-limited levels, check
sounds land on events and every word is audible over the music. You can view images with your file-reading tool and
build sheets with `uv run --with pillow python …` (`--with opencv-python-headless --with numpy` for flow). Scratch
space: {SCRATCH}. Do not modify any repository file except your report.

List any NEW defects too (black or glitch frames, overlaps, clipped text, a ring or card on the wrong part of a screen,
a window that pops, a face that changes within a role, garbled lettering, judder, a hold that drags, a sound missing on
a visible event, a silence, hiss).

Write the report (under 600 words) to {REPORT}, ending with SHIP or ONE MORE PASS (at most 5 fixes, ranked).
