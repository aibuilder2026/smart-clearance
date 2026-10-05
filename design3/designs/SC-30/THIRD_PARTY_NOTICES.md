# Third-party notices

## ThreeUI Community

Options 1 and 2 (`sc30.jsx`, compiled to `sc30.js`) adapt two effects from ThreeUI's free Community edition, at the maintainer's request (5 Oct 2026):

- the constellation field, `lib-dist/shaders/neuform-isolated/sources/constellation-field.html.js` (option 1);
- the gateway flow, `lib-dist/shaders/neuform-isolated/sources/gateway-flow.html.js` (option 2).

Source: [`@designcodeio/threeui`](https://www.npmjs.com/package/@designcodeio/threeui) 1.2.0 ([MengTo/threeui](https://github.com/MengTo/threeui), [threeui.com](https://threeui.com)).

Both effects are redrawn in design system v3:

- they use the system's inks over the town plate;
- the effects' soft halos are dropped, since the aura and the camera scanline are the only glows;
- they stop within five seconds instead of looping (WCAG 2.2.2).

No ThreeUI Pro or Beta source, and none of its fonts or assets, is used. If the picked option is built, this notice goes with the code into `design3/site` and the SvelteKit port.

```
MIT License

Copyright (c) 2026 Meng To

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
