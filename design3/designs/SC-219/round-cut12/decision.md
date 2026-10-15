# SC-219 cut 12 · the architecture scene, three concepts

## The request (15 Oct 2026, on cut 11)

> Ok so for point 2, I want the scenes and animation and effects to be more better and professional, think of Google
> Cloud Data center . Do one thing, show me some 3 ideas and I will pick... rest all is fine..

> I mean you can also have those done with remotion skills,

> I need animations and motion effects

Point 2 is the architecture scene, "under the hood" (0:22.5 to 0:56 of the film, 33.4 s, the lines t01, u02, u03, u17,
u18 and u06). Everything else in cut 11 stays as it is.

## The options

Each is a Remotion motion test of the scene's first two lines (0 to 9.9 s of the scene, the real voice and its sound),
with two stills of its later beats (the agents with their Gemini models; the money behind its guardrail and a
person's yes). The board is `board.html`, published privately as [Under the Hood Concepts](https://claude.ai/artifact/9i8WfqSADALu1Jj79MFXMy).

- **A · The data hall** (live action with motion graphics): a real camera moves through a hyperscale data centre at
  night (Qwen-Image plates, LTX camera moves), the stack laid onto its racks as the voice names each part, every
  graphic tracked to its rack (`src/track12c.py`): the cooling plant in Google's four colours, the cold aisle with the
  four apps as glass, Cloud Run's rack, Cloud SQL's record written row by row, the TPU hall for Gemini, the API's
  caged rack for the money.
- **B · The blueprint** (motion graphics): the data centre as one isometric floor plan in Smart-Clearance's greens,
  built and lit in motion: the camera pulls back from one rack's light as the hall rises; the apps' screens at the
  edge; Cloud Run's containers; Cloud SQL's disks; the agents' row with each model; Gemini's beams; a glass wall that
  stops the model at the money; the yes across the floor. Nothing generated.
- **C · Inside the machine** (macro product film): fibres, server sleds, a TPU under its cold plate, a locked cage, in
  macro with rack focus (Qwen-Image plates, LTX moves); each part set large as it is named, light running through
  the hardware.

**Recommended: A.** It is the data centre itself, filmed, as the note asks, and it keeps the live action of the rest
of the film; the motion graphics carry the stack, tracked onto real racks, with cut 10's notes. Both camera moves made
for the test came out clean on the first take, and the graphics held to their racks through a 1.4x push. B if the
scene should show how every part connects in one picture and stay quickest to change; C if it should feel most like a
hardware launch.

## Round 1's pick (15 Oct 2026)

None of the three: "None of these: rework". The notes for round 2, as the maintainer chose them:

- **Mix A and B:** the real data hall (A), with B's drawn connections over it: calls, events and Gemini's beams flowing
  between the racks as each part is named;
- **A brighter, Google look:** lighter and cleaner, Google's four colours, product-style tiles and icons, less dark and
  moody;
- **One continuous shot:** no cuts, a single unbroken camera move through the whole data centre, each part lighting up
  as the camera passes it.

## Round 2 (15 to 16 Oct 2026)

Two options were begun on those notes: D, the walk (one continuous glide down a bright Google-look aisle, each part
lighting as the camera passes, B's flows drawn between the racks) and E, the rise (the same glide, then up over the racks
until the hall becomes B's plan). Their bright hall was made (`round-2/`, two seeds) and the first chained camera move
begun, when the maintainer stopped the round: "Ok stop these".

## The pick (16 Oct 2026)

> I want you to revert back the 3D remotion animation effects you did in the last video to explain the architecture
> and think hard and better it.

> The entire thing should be sharp and surreal and explain the flow and components, camera movement and lighting
> should be perfect

**B, the blueprint, made whole** as cut 12's architecture scene: the isometric data centre floating in a dark green
void, one camera that never cuts and turns a little as it travels, each part rising and lighting on its word with cut 10's
notes, the flow drawn between the parts (the call, the events on Pub/Sub, the Scheduler's tick, sales and photos,
Gemini's beams), the glass round the money, and Priya's yes as a green wave through the hall. The SC-219 README's cut 12
section has the details.
