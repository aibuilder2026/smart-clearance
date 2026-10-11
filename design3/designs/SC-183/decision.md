# SC-183 · Live signatures on the certificate of destruction

## The request (11 Oct 2026)

> "I want that on Destruction Certificate Signatures are put live, when Evidence is being asked for , Distributor will
> upload photos and also there should space where witnesses, distrubotor and supervisors will put on a sign, and same
> sign should be seen by Supply chain operator too."

## Today

The distributor's destruction screen names the two witnesses but takes no signature. The certificate's four signatures
(the agency's supervising officer, two independent witnesses, the distributor for the goods he handed over) are
specimens on file (SC-174), the same ink on every certificate. Priya's review shows the photos and Vision's checks, and
no signature.

## The options

All on the slow week's chips (MF-2409-117, 144 packs, Orange City Enviro Services, OCE/DC/26-27/0219). In each, the four
sign to a sentence of their own, Send waits for all four, the strokes are kept as drawn with the time and drawn again on
Priya's review (once, 2.35 s in all, at once under reduced motion), the certificate and its PDF, the distributor's papers
and the Record; "Type the name instead" is the alternative to drawing.

- **A · On his screen** (recommended): four places on the destruction screen, under the witnesses; the tablet passes
  from hand to hand; each place opens a sheet with the sentence and the pad. Priya sees the four under the photos.
- **B · On the certificate**: the certificate laid out from what he entered, a numbered Sign here in each signature's
  place; Priya reviews the page as signed.
- **C · On their own phones**: the officer and each witness scan a code and sign on their own phone, no account, its
  place and time kept; Rakesh signs last on his screen.

## Open questions

- The pilot quarter's three certificates keep their specimen signatures (recommended), or carry drawn ones?
- Keep "Type the name instead" (recommended)?

## The pick (11 Oct 2026)

The maintainer picked **B · On the certificate**, and answered both questions as recommended:

- the pilot quarter's three certificates keep their specimen signatures, as signed on paper; certificates from now on
  carry the signatures as drawn;
- "Type the name instead" stays, the certificate marking a typed signature as typed.

Only B is built: design3 first, then backend-api, the agents and the frontend.

## The build

- **The kit:** `SignPad` (the pad, strokes in its own 640 × 220 box, Clear) and `InkStrokes` (the ink as drawn, fitted
  to its strokes, the pen a steady width; drawn once as signed, at once under reduced motion; a typed signature set in
  italic), in `system/kit.jsx` and `components.css`, ported to core.
- **Rakesh's destruction screen** (`trade.jsx` DestroyScreen, `SignSheet`): under the witnesses, "Sign the
  certificate": the agency's certificate laid out from what he entered, stamped TO SIGN, a numbered Sign here in each
  signature's place, "n of 4 signed · next: …", and Clear on each. The sheet names the signer, says who to hand the
  device to, gives the sentence they sign to, and takes the pad or the name typed ("Sign as Srinivas", past an
  initial). Send waits for all four. A witness renamed, or another agency chosen, signs again.
- **Priya's review** (`brand.jsx` DestructionSheet): "The certificate, as signed at the facility", page 1 stamped
  SIGNED, each signature drawing itself once, and the check "Four signatures on the certificate".
- **The certificate** (`finance.jsx` Certificate, Ink): each signer's ink where a specimen was, its time under it
  ("signed 13:22", "typed 13:24"), the agency's seal beside the officer's; the log initialled with the same ink. The
  history's three keep their specimens.
- **The data:** `data.js` STROKES (the four specimens traced, for the stub, the guided demo and the journey suites);
  `ledger.js` destructionDetail and draftCertificate; `flow.js` storySignatures.
- **backend-api:** the evidence carries `signatures` (officer, w1, w2, handed), each by the name the certificate prints,
  drawn (strokes in the pad's box) or typed; refused without all four, under another name, or with no ink. Each time is
  the device's, read on the journey's clock (else the moment it came). The certificate's facts carry the ink.
- **agents:** Paperwork draws each signature as inline SVG on the PDF (`drawn()`), the typed one in italic, its time
  under it.
- **The port:** core's `certificate.ts` (no seed, so the live workspace lays out the certificate to sign), `SignSheet`,
  DestroyScreen, DestructionSheet, Certificate, Ink; the live source sends the signatures; the guided demo's beats.

The build's stills are in `build/`: the certificate to sign (1440 light and dark, 390), the sheet with a signature
being drawn, the four signed (one typed), Priya's review (light and dark), the issued certificate, and its PDF.
