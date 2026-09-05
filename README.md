# Clay Studio — A Spatial Pottery Challenge

Clay Studio is a browser-based interactive 3D pottery experience. This hackathon edition focuses on one complete creative loop: shape a digital clay form into a wide bowl, move it through the making process, and finish with a displayable ceramic artifact.

## Track

**Creative 3D & VFX**

The project is a real-time creative 3D tool with a memorable visual result. It turns a pottery workflow into an interactive spatial experience that works in a browser and can be extended with an immersive / VR presentation mode.

## The two-minute demo loop

1. Start a new creation.
2. Directly drag the clay to shape the rim and body.
3. Complete the **Create a Wide Bowl** challenge.
4. Move through drying, firing, painting, and glazing.
5. Display the finished piece in the final 3D presentation state.

**Primary interaction:** direct manipulation of the clay mesh.

**Visible outcome:** a finished, displayable wide bowl with a changed shape, material, and presentation state.

The live demo intentionally follows one reliable path. The other tools remain available for exploration, but the presentation should focus on one interaction and one visible outcome.

## What makes it spatial

The clay is a real-time rotationally symmetric 3D mesh made from adjustable horizontal vertex rings. User input changes the mesh in the browser, while the camera, wheel, lighting, particles, materials, and display state create a small explorable 3D world.

The final display can be presented as an immersive / WebXR layer when the presentation device supports it. When WebXR is unavailable, the existing mouse-orbit camera remains the fallback so the core experience is still demonstrable.

## Technology roles

- **Custom JavaScript + Three.js/WebGL:** real-time clay deformation, camera interaction, pottery stages, scoring, UI state, and resettable demo flow.
- **World Labs:** spatial presentation reference and inspiration for treating a 3D environment as something to explore. The core app does not depend on a World Labs viewer loading successfully.
- **Tripo:** optional source for supporting 3D assets in a future or extended display scene. The pottery interaction itself is custom-built in this repository.
- **Mint / Convex:** not required for the focused single-player prototype. They are possible extensions for generated asset packs, shared galleries, or synchronized multiplayer state.

The project distinguishes between runtime dependencies and tools that informed the creative direction. It does not claim that one external service generated the entire application.

## Run locally

Because the project uses ES modules, serve the repository through a local static server:

```bash
cd clay-studio-hackathon
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

The project uses an import map to load Three.js from the official `unpkg` distribution, so the browser needs network access when the app starts. No build step is required.

## Controls

- Drag directly on the clay to shape it.
- Horizontal drag widens or narrows the active area.
- Upward drag pulls the form taller.
- Downward drag compresses the form.
- Drag outside the clay to orbit the camera.
- Mouse wheel zooms.
- Use **Expand** to make the wide-bowl challenge legible in the live demo.
- Use **Smooth**, **Pinch**, **Compress**, and **Cut rim** for optional refinement.
- Use **Undo**, **Redo**, and **Reset** to keep the demo recoverable.

## Demo checklist

- [ ] State the problem: 3D creation tools often show an output without making the making process tangible.
- [ ] State the interaction: directly shape a clay mesh into a wide bowl.
- [ ] Show the working experience before explaining the implementation.
- [ ] Advance the piece through the making stages.
- [ ] Stop on the final display state with the artifact clearly visible.
- [ ] Explain that custom WebGL handles the interaction and stage state.
- [ ] Explain any World Labs, Tripo, Mint, or Convex role accurately and only if it is actually used in the submitted build.
- [ ] Keep **New Creation** and **Reset** visible as recovery paths.
- [ ] Test on the presentation device.
- [ ] Save a short screen recording as a fallback.

## Suggested pitch

> Clay Studio turns 3D pottery into a direct, spatial interaction. The user shapes a digital clay form into a wide bowl, takes it through a simple making process, and ends with a finished artifact they can display. The real-time deformation and stage system are custom-built in WebGL; the project can be extended with World Labs-inspired spatial presentation without making the core demo depend on it.

## Existing prototype and hackathon edition

The project began as an earlier pottery prototype. For this event, it is presented as a focused competition build: one challenge, one primary interaction, one visible outcome, and a short resettable path that can be demonstrated reliably in two minutes.

## Features

- Rotationally symmetric pottery mesh made from adjustable horizontal vertex rings.
- Smooth deformation with nearby-ring interpolation and radius constraints.
- Drying, firing, painting, glazing, display, gallery, scoring, screenshot export, photo mode, fullscreen, pause/settings, and localStorage saves.
- Procedural Web Audio pottery wheel, clay touch, kiln ambience, and calm background tones.

No copyrighted assets, logos, sounds, code, or artwork from existing games are included.
