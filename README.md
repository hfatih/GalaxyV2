<div align="center">

# GalaxyV2

**Shape a galaxy and watch its disk evolve**

[**Open the studio ↗**](https://hfatih.github.io/GalaxyV2/) · [Türkçe](README.tr.md) · [Controls](#controls)

![React 18](https://img.shields.io/badge/React-18-263650?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-WebGL-263650?style=flat-square)
[![MIT](https://img.shields.io/badge/License-MIT-9ab7ff?style=flat-square)](LICENSE)

[![GalaxyV2 with a full-screen Milky Way and its evolution timeline](assets/samanyolu.jpg)](https://hfatih.github.io/GalaxyV2/)

</div>

GalaxyV2 brings the original [Samanyolu3D](https://github.com/hfatih/samanyolu3d) controls into a full-screen 3D viewer. Open the Milky Way, Andromeda or **Özel Ayar** (Custom). Use **Ayarlar** to change the arms and bend the disk while the model stays in view.

## Controls

| Panel | Setting | Range |
| --- | --- | --- |
| **Kollar ve disk** | Arm count | 2–8 |
| | Arm twist | 0–4 |
| | Arm spread | 0.05–1.2 |
| | Disk warp | 0–40 |
| **Yıldız popülasyonu** | Disk samples | 20,000–400,000 |
| | Bulge samples | 2,000–80,000 |
| | Halo samples | 2,000–100,000 |
| **Görünüm ve hareket** | Disk point size | 0.1–3 |
| | Rotation speed | 0–0.2 |
| | Dust layer | On/off |

Drag a slider or type a value next to it. **Sıfırla** restores the selected model’s defaults. **Özel Ayar** remembers its settings when you switch presets during the session.

| Camera action | Desktop | Touch |
| --- | --- | --- |
| Orbit | Left-drag | One-finger drag |
| Pan | Right-drag or arrow keys with the viewport focused | Two-finger drag |
| Zoom | Mouse wheel | Pinch |
| Change angle | **Eğik**, **Üst**, **Yan** | Same buttons |

**Yan** is the edge-on view for checking disk warp. The camera bar includes browser fullscreen and a landmark toggle. The galactic center is available in every model. The Solar System and Orion Arm appear only in the Milky Way.

<details>
<summary>Andromeda in the studio</summary>

![Andromeda after 150 million years of differential rotation](assets/andromeda.jpg)

</details>

## Evolution model

**Diferansiyel dönüş** advances each disk sample on a circular orbit at its own radius. **Sabit biçim** gives the disk a single angular speed at the preset's reference radius for comparison. Pause, scrub or reset the timeline to inspect an age between 0 and 1,000 million years.

The squared circular speed in the midplane sums the contributions of a Miyamoto–Nagai disk, a Hernquist bulge and a Navarro–Frenk–White halo. For radius $R$ in kpc and circular speed $v_c$ in km/s:

$$
v_c^2=v_{\mathrm{disk}}^2+v_{\mathrm{bulge}}^2+v_{\mathrm{halo}}^2,
\qquad
\Omega(R)=1.022712165\times10^{-3}\frac{v_c(R)}{R}\ \mathrm{rad/Myr}.
$$

The GPU calculates each sample's azimuth as $\phi(t)=\phi_0-\Omega(R)t$, holding its initial radius and height fixed. The inner 0.35 kpc shares one angular speed. In this model the arms are material features in a fixed axisymmetric field. It omits self-gravity, gas dynamics and star formation. [Differential winding](https://galaxiesbook.org/chapters/IV-04.-Internal-Evolution-in-Galaxies_3-Spiral-structure.html) · [Milky Way rotation curve](https://arxiv.org/abs/1810.09466)

## Rendering and scale

Shape, age and population changes reuse the GPU buffers. Automatic quality adapts the drawing resolution and the visible fraction of the selected samples to measured frame times. The quality indicator displays that fraction when reduced.

The sample scale divides the original presets’ reference population by the combined disk, bulge and halo sample count. Samanyolu3D uses 150 billion for the Milky Way and one trillion for Andromeda. These are reference values for the display. The scene uses model-space distances and contains illustrative landmark positions. See the original project’s [references](https://github.com/hfatih/samanyolu3d#-references--scientific-notes).

## Run locally

Node.js 22.12 or later and a WebGL-capable browser.

```sh
git clone https://github.com/hfatih/GalaxyV2.git
cd GalaxyV2
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

React renders the studio. Three.js and React Three Fiber render the scene. Vite builds the site into `dist/`. GitHub Pages serves that compiled output from the `gh-pages` branch. [Galaxy model](src/model.js) · [3D scene](src/Scene.jsx) · [Settings panel](src/Inspector.jsx)

The code is [MIT licensed](LICENSE). The bundled [DM Sans](assets/dm-sans-OFL.txt) fonts use the SIL Open Font License.
