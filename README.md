<div align="center">

# GalaxyV2

**An interactive 3D atlas of the Milky Way and Andromeda**

[**Open the live atlas ↗**](https://hfatih.github.io/GalaxyV2/) · [Türkçe](README.tr.md) · [The physics](#the-physics)

![WebGL 2](https://img.shields.io/badge/Renderer-WebGL%202-242b3c?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20modules-242b3c?style=flat-square)
[![License: MIT](https://img.shields.io/badge/License-MIT-dba971?style=flat-square)](LICENSE)

[![GalaxyV2 showing the Milky Way, the solar-circle orbit and the rotation curve](assets/samanyolu.jpg)](https://hfatih.github.io/GalaxyV2/)

</div>

GalaxyV2 is an independent rewrite of [Samanyolu3D](https://github.com/hfatih/samanyolu3d). Fly around a four-arm Milky Way or an Andromeda model with a 10 kpc star-forming ring. Change the radius of a test orbit and follow its marker on the galaxy and on the rotation curve.

## Explore

| Control | What it changes |
| --- | --- |
| **Samanyolu / Andromeda** | Galaxy model, morphology, mass profile and reference orbit |
| **Eğik / Tepeden / Yandan** | Oblique, face-on and edge-on views |
| **Drag / pinch / wheel** | Orbit the camera and zoom. Use arrow keys and +/− when the canvas has keyboard focus. |
| **Yıldız / Gaz / Toz / Yörünge** | Stellar samples, gas emission, dust attenuation and test-orbit overlay |
| **Yörünge yarıçapı** | Probe radius in kpc, with circular speed in km/s and period in Myr |
| **Timeline** | Play, pause, scrub, reset or change the rate in millions of simulated years per second |

<details>
<summary>Andromeda preview</summary>

![Andromeda's star-forming ring and its rotation curve in GalaxyV2](assets/andromeda.jpg)

</details>

## The physics

### The gravitational field

GalaxyV2 combines a flattened Miyamoto–Nagai disk, a spherical Hernquist bulge and a spherical Navarro–Frenk–White halo. Here $R$ is the cylindrical radius, $z$ is the height above the disk and $r=\sqrt{R^2+z^2}$. The code uses the WebGL $y$ axis as disk height.

$$
\Phi(R,z)=
-\frac{GM_d}{\sqrt{R^2+(a_d+\sqrt{z^2+b_d^2})^2}}
-\frac{GM_b}{r+a_b}
-\frac{GM_s}{r}\ln\!\left(1+\frac{r}{r_s}\right)
$$

The NFW normalization $M_s=4\pi\rho_s r_s^3$ is a scale mass. The circular speed follows from the midplane radial derivative:

$$
v_c^2(R)=R\,\left.\frac{\partial\Phi}{\partial R}\right|_{z=0}
=v_d^2(R)+v_b^2(R)+v_h^2(R)
$$

| Parameter | Milky Way | Andromeda |
| --- | ---: | ---: |
| Visual disk radius | 25 kpc | 33 kpc |
| Disk mass $M_d$ | $6.25\times10^{10}\,M_\odot$ | $8.9\times10^{10}\,M_\odot$ |
| Disk scales $a_d, b_d$ | 3.0, 0.28 kpc | 5.4, 0.53 kpc |
| Bulge mass $M_b$ | $9.0\times10^9\,M_\odot$ | $3.1\times10^{10}\,M_\odot$ |
| Bulge scale $a_b$ | 0.55 kpc | 0.86 kpc |
| Halo scale mass $M_s$ | $6.0\times10^{11}\,M_\odot$ | $9.5\times10^{11}\,M_\odot$ |
| Halo scale radius $r_s$ | 17 kpc | 19 kpc |
| Model result at reference radius | 228 km/s at 8.2 kpc | 260 km/s at 10 kpc |

The presets are illustrative parameter choices. For context, Eilers et al. measured about 229 km/s near the Sun using stellar kinematics. [Eilers et al. (2019)](https://arxiv.org/abs/1810.09466)

### Orbits and spiral structure

- **Disk motion.** Old disk samples advance by $\Omega(R)t$, where $\Omega(R)=v_c(R)/R$. They retain their display height so the model can show disk thickness and warp without integrating each star.
- **Orbit probe.** The gold tracer uses kick–drift–kick leapfrog in the full 3D potential with a fixed step of at most 0.5 Myr. It starts in the midplane at the selected radius with tangential speed $v_c$.
- **Spiral and ring tracers.** The nominal arm phase follows $\theta(R)=\theta_0+\ln(R/R_0)/\tan i$ with pitch angle $i$. Spiral arms, the central bar, gas and dust rotate as prescribed patterns. The Andromeda preset superimposes a star-forming ring. [Lewis et al. (2015)](https://arxiv.org/abs/1504.03338)

The gravitational potential is fixed and axisymmetric. The visual bar and spiral patterns do not exert forces, and the sampled stars do not interact gravitationally. The preset parameters, brightness, gas and dust are intended for exploration. The atlas does not fit a stellar catalogue or solve the evolution of a self-gravitating galaxy.

## Run locally

Requires Node.js 22+ for the local server and tests, and a WebGL 2 browser for the 3D view.

```sh
git clone https://github.com/hfatih/GalaxyV2.git
cd GalaxyV2
npm run dev
```

Open [http://127.0.0.1:4173](http://127.0.0.1:4173). The app uses native browser modules, WebGL 2 and locally bundled fonts. It has no npm dependencies or build step. GitHub Pages serves the root of the `main` branch.

```sh
npm test
```

The tests check the analytic force against finite differences, the solar-circle speed, the component contributions, input bounds, energy and axial angular momentum across an inclined eccentric orbit, and seeded population sampling.

| File | Responsibility |
| --- | --- |
| [`src/physics.js`](src/physics.js) | Presets, potential, analytic force, circular speeds and leapfrog |
| [`src/population.js`](src/population.js) | Seeded star, bulge, halo, gas and dust sampling |
| [`src/renderer.js`](src/renderer.js), [`src/shaders.js`](src/shaders.js) | GPU particle layers, dust blending, tone mapping and camera projection |
| [`src/chart.js`](src/chart.js), [`src/main.js`](src/main.js) | Rotation curve, orbit selection, camera and time controls |

## References

- Miyamoto & Nagai (1975). [Three-Dimensional Models for the Distribution of Mass in Galaxies](https://doi.org/10.1093/pasj/27.4.533)
- Hernquist (1990). [An Analytical Model for Spherical Galaxies and Bulges](https://ui.adsabs.harvard.edu/abs/1990ApJ...356..359H/abstract)
- Navarro, Frenk & White (1997). [A Universal Density Profile from Hierarchical Clustering](https://arxiv.org/abs/astro-ph/9611107)

MIT licensed. Instrument Serif and DM Sans are distributed under their respective [Instrument Serif OFL](assets/instrument-serif-OFL.txt) and [DM Sans OFL](assets/dm-sans-OFL.txt).
