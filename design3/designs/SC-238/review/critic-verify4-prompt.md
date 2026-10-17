You are an independent critic in a Gauntlet loop; you did NOT build this. Judge rendered pixels and measurable audio,
not intentions.

Artifact: {ARTIFACT} ({DURATION} s, the master: 1920 × 1080 at 60 fps, every clip interpolated to 60 fps, with the
film's final mix). It is the landing page's demo film for Smart-Clearance, agentic software that routes an FMCG brand's
near-expiry stock to kiranas, staff sales, food banks and a near-expiry marketplace instead of the bin, told as a short
film.

The previous verification: /Users/arundutta/projects/smart-clearance/design3/designs/SC-238/review/r3-verify.md (on the
451.8 s master). Timings have moved: until the chips' landfill (about 5:50) by under 0.1 s, except the platform
scene's card, unchanged in length; from the landfill on, by about 18 s later. Find each item by its picture, not its
old timestamp.

Since r3 the maintainer gave four notes, which this cut answers. Check each first:
1. "some scenes have some background noise and hissing sound": no scene should hiss. Measure every shot's noise
   floor, the 6 to 14 kHz band above all, in the gaps between words and under the room tone; report any stretch whose
   high band sits within 30 dB of the dialogue, or any steady broadband noise you can hear.
2. "The scenes where the user is talking to the camera, they must look at the camera - like the kiranas and feeding
   india agent": the kirana owner ("Two free with every ten!"), the food bank volunteer ("Fifty-eight packs. All
   sealed."), the shopkeeper ("The bill's inside? Good."), the wholesale buyer ("Fourteen-twenty. Done. Truck's
   coming.") and the distributor at the landfill ("All four signatures. It's on record.") should look into the lens as
   they speak. The two phone calls and the lead's answer ("Not one pack. Approved.") are conversations, off the lens.
3. "The destruction process signing and photo taking seems to be gone, I need that in a cinematic way and no
   hallucinations, distributor filming the disposal process and uploading. The current scene looks unrealistic": the
   landfill sequence (from "On expiry day") should show the place, the distributor filming over his shoulder (the app's
   camera live in his tablet, the shutter), the packs slit open and emptied, the earth over them, the photos uploading
   in the app, the officer and the witnesses signing on his tablet with the app's own sign sheets, his line, the send
   and Vision's checks. Look for anything invented or impossible: a hand through a tablet, a morphing carton or packet,
   garbled lettering, a face that changes, a screen that does not match its pop-out.
4. "The wholesaler buying scene, seems like he is shouting": his line should be calm, at a conversational level.

Then, for every item in r3-verify.md's verdict and its listed defects, give FIXED / PARTLY / STILL PRESENT with the new
timestamps (the orders window's stage cards, one shopkeeper, the brand head, the staff man's jaw label, the UPI phone's
seams, the buyer's slip, the orb dive's sound, the silent cuts, the 1:20 freeze, the 3:12 exposure step, the bin
aerial's repeated frames, the credit note's drift, the sliding day count, the bindi, the certificate flash, the papers'
see-through dissolves, the install scene's background, the godown plate used three times).

The client's criteria (mandatory): 1. draw on the four-minute working demo; 2. no hand seen through the tablet at the
landfill; 3. papers not tilted; 4. pointers on the right place; 5. FSSAI's guidelines in detail; 6. professional scene
transitions; 7. sound effects all over, no blank portion of any screen; 8. the agentic flow standing out in 3D; 9. the
screen people watch matches its pop-out; 10. every scene with video or motion, blurred backgrounds video too;
11. realistic talking characters, like a short film; 12. no glitchy, blurry transitions; 13. backgrounds like the papers
scene: video under a green overlay that tells a story. Also: the whole journey; smooth (60 fps, never laggy); 450 to
480 seconds. The film's own words name no client; the app's screens show a fictional sample workspace.

Method: extract frames yourself with ffmpeg (contact sheets every 0.5 s, native frames at key moments, dense 1/60 s
strips around every cut and transition), compute frame differences for frozen stretches and for judder (repeated frames
in motion), scan for black frames, measure the audio with ebur128 and band-limited levels, check sounds land on events
and every word is audible over the music. You can view images with your file-reading tool and build sheets with
`uv run --with pillow python …`. Scratch space: {SCRATCH}. Do not modify any repository file except your report.

List any NEW defects too (black or glitch frames, overlaps, clipped text, a ring or card on the wrong part of a screen,
a window that pops, a face that changes within a role, garbled lettering, judder, a hold that drags, a sound missing on
a visible event, a silence, hiss).

Write the report (under 600 words) to {REPORT}, ending with SHIP or ONE MORE PASS (at most 5 fixes, ranked).
