# Asset credits

All 3D models come from NASA's 3D Resources (science.nasa.gov). Downloaded 14 Nov 2026.

| File in `public/models/` | Title | Credit | Source page | Notes |
|---|---|---|---|---|
| `opportunity.glb` | Spirit and Opportunity Rover, 3D Model | NASA/JPL-Caltech | https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/ | Textures converted to WebP and geometry Draco-compressed with glTF-Transform (11.9 MB → 0.8 MB). Spirit and Opportunity were identical twins, so this model is accurate for Opportunity. |
| `apollo-lm.glb` | Apollo Lunar Module | NASA/Michael D. Carbajal | https://science.nasa.gov/3d-resources/apollo-lunar-module/ | Unmodified. |
| `ingenuity.glb` | Ingenuity Mars Helicopter | NASA/Brian E. Kumanchik | https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/ | Unmodified. |
| `insight.glb` | InSight Cruise Lander (arm deployed) | NASA/Brian E. Kumanchik | https://science.nasa.gov/3d-resources/insight-cruise-lander/ | Unmodified. Landed configuration before the seismometer and heat probe were placed on the ground. |

## Photographs

| File in `public/photos/` | Title | Credit | Source page | Notes |
|---|---|---|---|---|
| `eagle-crater-wide.webp`, `eagle-crater-narrow.webp` | Opportunity Captures "Lion King" Panorama (PIA05755) | NASA/JPL/Cornell | https://science.nasa.gov/photojournal/opportunity-captures-lion-king-panorama | Approximate true-colour Pancam panorama of Eagle crater (Opportunity's landing site, with its lander) taken on sols 58 and 60. Cropped to the ground and horizon above the rover deck, scaled to 820 px and 420 px tall, WebP. Used as the ground behind the 3D model; decorative, so no alt text. Downloaded 14 Nov 2026. |
| `perseverance-valley-wide.webp`, `perseverance-valley-narrow.webp` | Opportunity Legacy Pan (True Color) (PIA22909) | NASA/JPL-Caltech/Cornell/ASU | https://science.nasa.gov/photojournal/opportunity-legacy-pan-true-color | Opportunity's last panorama, from Perseverance Valley, sols 5,084–5,111. Cropped from the full TIFF (23,123 × 5,163) to the valley floor, scaled to 760 px and 400 px tall, WebP. Ground for steps 9–12. |
| `purgatory-tracks.webp` | Looking Back at 'Purgatory Dune' (PIA07999) | NASA/JPL | https://science.nasa.gov/photojournal/looking-back-at-purgatory-dune | Scaled to 720 px. Step 5. |
| `marathon-route.webp` | Opportunity Rover's Full Marathon-Length Traverse (PIA19154) | NASA/JPL-Caltech/MSSS/NMMNHS | https://science.nasa.gov/resource/opportunity-rovers-full-marathon-length-traverse | Scaled to 1100 px. Step 8. |
| `last-message.webp` | Opportunity's Last Message (PIA22929) | NASA/JPL-Caltech/Cornell/ASU | https://science.nasa.gov/photojournal/opportunitys-last-message | Scaled to 720 px. Step 10. |

No NASA 3D model was found for Sojourner; its chapter uses a NASA photo with pins.

`public/draco/` holds the Draco mesh decoder copied from the `three` package (Apache-2.0), so models load without contacting a CDN.

The original, unmodified downloads are kept locally in `assets-src/` (not committed).

NASA content is generally not subject to copyright in the United States; NASA's media guidelines ask that NASA be acknowledged as the source and that the NASA insignia not be used to imply endorsement.
