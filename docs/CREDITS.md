# Asset credits

All 3D models come from NASA's 3D Resources (science.nasa.gov). Downloaded 14 Nov 2026.

| File in `public/models/` | Title | Credit | Source page | Notes |
|---|---|---|---|---|
| `opportunity.glb` | Spirit and Opportunity Rover, 3D Model | NASA/JPL-Caltech | https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/ | Textures converted to WebP and geometry Draco-compressed with glTF-Transform (11.9 MB → 0.8 MB). Spirit and Opportunity were identical twins, so this model is accurate for Opportunity. |
| `apollo-lm.glb` | Apollo Lunar Module | NASA/Michael D. Carbajal | https://science.nasa.gov/3d-resources/apollo-lunar-module/ | Unmodified. |
| `ingenuity.glb` | Ingenuity Mars Helicopter | NASA/Brian E. Kumanchik | https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/ | Unmodified. |
| `insight.glb` | InSight Cruise Lander (arm deployed) | NASA/Brian E. Kumanchik | https://science.nasa.gov/3d-resources/insight-cruise-lander/ | Unmodified. Landed configuration before the seismometer and heat probe were placed on the ground. |

No NASA 3D model was found for Sojourner; its chapter uses a NASA photo with pins.

`public/draco/` holds the Draco mesh decoder copied from the `three` package (Apache-2.0), so models load without contacting a CDN.

The original, unmodified downloads are kept locally in `assets-src/` (not committed).

NASA content is generally not subject to copyright in the United States; NASA's media guidelines ask that NASA be acknowledged as the source and that the NASA insignia not be used to imply endorsement.
