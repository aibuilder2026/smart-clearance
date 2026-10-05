# Third-party notices

## ThreeUI Community

SC-32's options draw on two effects from ThreeUI's free Community edition, through the `threeui-community` plugin's
local copy of the catalog (github.com/MengTo/threeui at `68802d5`, package 1.2.0):

- the constellation field, `src/shaders/neuform-isolated/sources/constellation-field.html`: its linked nodes, the
  link-distance ramp and the pointer's pull, as SC-30's option 1 adapted them (options 1 and 3, in `sc32-options.jsx`);
- the gallery, `src/shaders/gallery/Gallery.tsx`: image panels bent round a turning cylinder. Option 2 rebuilds the idea in
  CSS 3D, each panel cut into slices round the cylinder, rather than Three.js.

Both are redrawn in design system v3:

- the system's inks over the plates, with no glows (the aura and the camera scanline are the only glows);
- they stop within five seconds instead of looping (WCAG 2.2.2).

No ThreeUI Pro or Beta source, and none of its fonts or assets, is used. If the picked option is built, this notice goes
with the code into `design3/site` and the SvelteKit port.

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
