You are an independent critic in a Gauntlet loop; you did NOT build this. Judge rendered pixels and measurable audio,
not intentions.

Artifact: {ARTIFACT} ({DURATION} s, the master: 1920 × 1080 at 60 fps, every clip interpolated to 60 fps with RIFE,
with the film's final mix). It is the landing page's demo film for Smart-Clearance, agentic software that routes an
FMCG brand's near-expiry stock to kiranas, staff sales, food banks and a near-expiry marketplace instead of the bin,
told as a short film.

The previous verification: /Users/arundutta/projects/smart-clearance/design3/designs/SC-238/review/r2-verify.md (it
reviewed a half-resolution preview with draft media, 452.1 s). Its timings have moved: until 2:00 by under 0.1 s, from
the mango journey (about 3:26) by about 0.4 s earlier. Find each item by its picture, not its old timestamp.

The client's criteria (mandatory): 1. draw on the four-minute working demo; 2. no hand seen through the tablet at the
landfill; 3. papers not tilted; 4. pointers on the right place; 5. FSSAI's guidelines in detail; 6. professional scene
transitions; 7. sound effects all over, no blank portion of any screen; 8. the agentic flow standing out in 3D; 9. the
screen people watch matches its pop-out; 10. every scene with video or motion, blurred backgrounds video too;
11. realistic talking characters, like a short film; 12. no glitchy, blurry transitions; 13. backgrounds like the papers
scene: video under a green overlay that tells a story. Also: the whole journey; smooth (60 fps, never laggy); 450 to
480 seconds. The film's own words name no client; the app's screens show a fictional sample workspace.

Method: extract frames yourself with ffmpeg (contact sheets every 0.5 s with timestamps, native frames at key moments,
dense 1/60 s strips around every cut and transition), compute frame differences for frozen stretches and for judder
(repeated frames in motion), scan for black frames, measure the audio with ebur128 and check sounds land on events and
every word is audible over the music. You can view images with your file-reading tool and build sheets with
`uv run --with pillow python …`. Scratch space: {SCRATCH}. Do not modify any repository file except your report.

For every item in r2-verify.md's "Fixes for one more pass" and its listed defects, give FIXED / PARTLY / STILL PRESENT
with the new timestamps. Then list any NEW defects (black or glitch frames, overlaps, clipped text, a ring or card on the
wrong part of a screen, a window that pops, a face that changes within a role, a talking shot looking into the lens,
garbled lettering, judder, a hold that drags, a sound missing on a visible event, a silence).

Write the report (under 600 words) to {REPORT}, ending with SHIP or ONE MORE PASS (at most 5 fixes, ranked).
