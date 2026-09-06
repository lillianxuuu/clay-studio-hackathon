# Clay Studio — A Spatial Pottery Challenge

Clay Studio is a browser-based interactive 3D pottery experience inspired by the simple joy of making something by hand. You shape a piece of clay, take it through a small pottery workflow, and end with an artifact that feels like your own.

## Track

**Creative 3D & VFX**

The project is a real-time creative 3D tool with a memorable visual result. It turns a pottery workflow into an interactive spatial experience that works in a browser and can be extended with an immersive / VR presentation mode.

## The two minute demo loop

1. Start a new piece.
2. Drag directly on the rotating clay form and watch it respond to your hand.
3. Shape the form to match the current challenge.
4. Move the piece through drying, firing, painting, and glazing.
5. Display the finished piece and start again if you want to try a different form.

**Primary interaction:** directly shaping the clay with the cursor.

**Visible outcome:** a finished ceramic piece with a shape, color, and material that changed through your decisions.

The demo is intentionally small. The important moment is seeing the clay change as you work on it, then carrying that piece through the rest of the process. The other tools are there if someone wants to keep experimenting.

## What makes it spatial

The clay is a real-time rotationally symmetric 3D mesh made from adjustable horizontal vertex rings. User input changes the mesh in the browser, while the camera, wheel, lighting, particles, materials, and display state create a small explorable 3D world.

The final display can be presented as an immersive / WebXR layer when the presentation device supports it. When WebXR is unavailable, the existing mouse-orbit camera remains the fallback so the core experience is still demonstrable.

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
- Use the shaping tools to make the current challenge easier to demonstrate.
- Use **Smooth**, **Pinch**, **Compress**, and **Cut rim** for optional refinement.
- Use **Undo**, **Redo**, and **Reset** to keep the demo recoverable.

## Demo checklist

- [ ] State the idea: digital tools can show the finished object, but the joy is often in the making.
- [ ] State the interaction: directly shape a clay mesh and see it respond in real time.
- [ ] Show the working experience before explaining the implementation.
- [ ] Advance the piece through the making stages.
- [ ] Stop on the final display state with the artifact clearly visible.
- [ ] Explain that custom WebGL handles the interaction and stage state.
- [ ] Keep **New Creation** and **Reset** visible as recovery paths.
- [ ] Test on the presentation device.
- [ ] Save a short screen recording as a fallback.

## Suggested pitch

> Clay Studio is a small digital pottery studio built around the joy of making. You shape clay directly with your cursor, take it through drying, firing, painting, and glazing, and finish with an artifact that came from your own decisions. It is less about getting a perfect result and more about enjoying the process of making it.

## Existing prototype and hackathon edition

The project began as an earlier pottery prototype. For this event, it is presented as a focused competition build: one challenge, one primary interaction, one visible outcome, and a short resettable path that can be demonstrated reliably in two minutes.

## Features

- Rotationally symmetric pottery mesh made from adjustable horizontal vertex rings.
- Smooth deformation with nearby-ring interpolation and radius constraints.
- Drying, firing, painting, glazing, display, gallery, scoring, screenshot export, photo mode, fullscreen, pause/settings, and localStorage saves.
- Procedural Web Audio pottery wheel, clay touch, kiln ambience, and calm background tones.

No copyrighted assets, logos, sounds, code, or artwork from existing games are included.
