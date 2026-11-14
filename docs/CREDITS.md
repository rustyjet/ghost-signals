# Asset credits

All 3D models come from NASA's 3D Resources (science.nasa.gov). Downloaded 14 Nov 2026.

| File in `public/models/` | Title | Credit | Source page | Notes |
|---|---|---|---|---|
| `opportunity.glb` | Spirit and Opportunity Rover, 3D Model | NASA/JPL-Caltech | https://science.nasa.gov/resource/spirit-and-opportunity-rover-3d-model/ | Textures converted to WebP and geometry Draco-compressed with glTF-Transform (11.9 MB → 0.8 MB). Spirit and Opportunity were identical twins, so this model is accurate for Opportunity. |
| `apollo-lm.glb` | Apollo Lunar Module | NASA/Michael D. Carbajal | https://science.nasa.gov/3d-resources/apollo-lunar-module/ | Unmodified. |
| `ingenuity.glb` | Ingenuity Mars Helicopter | NASA/Brian E. Kumanchik | https://science.nasa.gov/3d-resources/ingenuity-mars-helicopter/ | Unmodified. |
| `insight.glb` | InSight Cruise Lander (arm deployed) | NASA/Brian E. Kumanchik | https://science.nasa.gov/3d-resources/insight-cruise-lander/ | Unmodified. Landed configuration before the seismometer and heat probe were placed on the ground. |

## Photographs

All downloaded 14 Nov 2026 and converted to WebP with ffmpeg. "Step" is the Opportunity chapter step that shows the photo (0 = title).

| File in `public/photos/` | Title | Credit | Source page | Notes |
|---|---|---|---|---|
| `eagle-crater-wide.webp`, `eagle-crater-narrow.webp` | Opportunity Captures "Lion King" Panorama (PIA05755) | NASA/JPL/Cornell | https://science.nasa.gov/photojournal/opportunity-captures-lion-king-panorama | Approximate true-colour Pancam panorama of Eagle crater (the landing site, with the lander), sols 58 and 60. Ground band under the 3D rover. Step 0. |
| `eagle-crater-photo.webp` | Same (PIA05755) | NASA/JPL/Cornell | Same | Cropped 7000 × 1330 above the rover deck, scaled to 1100 px tall. Full-screen photo, steps 1–2. |
| `berry-bowl.webp` | Discovery Served Up in a Bowl (PIA05634) | NASA/JPL/Cornell | https://science.nasa.gov/photojournal/discovery-served-up-in-a-bowl | Calibration strip at the bottom cropped off. Step 3. |
| `endurance-horizon.webp` | 'Endurance' Looms on the Horizon (PIA05847) | NASA/JPL/Cornell | https://photojournal.jpl.nasa.gov/catalog/PIA05847 | Taken on sol 93, about 70 m from Endurance crater's rim. Black/white mosaic borders cropped. Step 4 (day 91). |
| `purgatory-wide.webp`, `purgatory-tall.webp` | Opportunity's 'Rub al Khali' Panorama (PIA07216) | NASA/JPL/Cornell | https://science.nasa.gov/photojournal/opportunitys-rub-al-khali-panorama/ | Taken sols 456–464 at Purgatory Dune; the ruts from being stuck are in the foreground. Two crops around the tracks. Step 5. |
| `sky-2007.webp` | A Darkened Mars Sky | NASA/JPL-Caltech/Cornell | https://science.nasa.gov/resource/a-darkened-mars-sky/ | Five frames, sols 1,205–1,235 (14 June to 15 July 2007). Label rows above and below the frames cropped off so it can fill the screen. Step 6. |
| `selfie-dusty.webp` | Self-Portrait by Opportunity Mars Rover in January 2014 (PIA17759) | NASA/JPL-Caltech/Cornell Univ./Arizona State Univ. | https://science.nasa.gov/photojournal/self-portrait-by-opportunity-mars-rover-in-january-2014 | Cropped and scaled (2400 px wide) to match the March portrait so the two line up for the wipe. Step 7. |
| `selfie-clean.webp` | Self-Portrait by Freshly Cleaned Opportunity Mars Rover in March 2014 (PIA18079) | NASA/JPL-Caltech/Cornell Univ./Arizona State Univ. | https://science.nasa.gov/photojournal/self-portrait-by-freshly-cleaned-opportunity-mars-rover-in-march-2014 | Cropped and scaled to 2400 px wide, as above. Step 7. |
| `marathon-map.webp` | Opportunity Rover's Full Marathon-Length Traverse (PIA19154) | NASA/JPL-Caltech/MSSS/NMMNHS | https://science.nasa.gov/resource/opportunity-rovers-full-marathon-length-traverse | Scaled to 2600 px wide. Step 8. |
| `sprained-ankle.webp` | Panorama Above Perseverance Valley ('Sprained Ankle') (PIA21723) | NASA/JPL-Caltech/Cornell/Arizona State Univ. | https://science.nasa.gov/photojournal/panorama-above-perseverance-valley-on-mars/ | Taken sols 4,753–4,765 (June 2017) while engineers diagnosed a front-wheel steering stall. Black lower edge cropped. Step 9. |
| `last-picture.webp` | Opportunity's Last Message (PIA22929) | NASA/JPL-Caltech/Cornell/ASU | https://science.nasa.gov/photojournal/opportunitys-last-message | The last few rows before the black band are faded into it, so the edge reads softly when the picture fills the screen. Step 10. |
| `perseverance-valley-wide.webp`, `perseverance-valley-narrow.webp` | Opportunity Legacy Pan (True Color) (PIA22909) | NASA/JPL-Caltech/Cornell/ASU | https://science.nasa.gov/photojournal/opportunity-legacy-pan-true-color | Opportunity's last panorama, sols 5,084–5,111. Cropped from the full TIFF to the valley floor. Ground band under the 3D rover, step 12. |

No NASA 3D model was found for Sojourner; its chapter uses a NASA photo with pins.

`public/draco/` holds the Draco mesh decoder copied from the `three` package (Apache-2.0), so models load without contacting a CDN.

The original, unmodified downloads are kept locally in `assets-src/` (not committed).

NASA content is generally not subject to copyright in the United States; NASA's media guidelines ask that NASA be acknowledged as the source and that the NASA insignia not be used to imply endorsement.

## Home page photos (downloaded 14 Nov 2026)

| File | What | Credit | Source | Changes |
|---|---|---|---|---|
| `earth.webp` | Earth from Apollo 17 ("Blue Marble"), Dec 1972 | NASA (AS17-148-22727) | https://images.nasa.gov/details/as17-148-22727 | Cropped square around the disc, scaled to 1600 px. |
| `moon.webp` | Full Moon from Apollo 11 on the way home, July 1969 | NASA (AS11-44-6667) | https://images.nasa.gov/details/as11-44-6667 | Cropped square around the disc, 1440 px. |
| `mars.webp` | Mars, Viking orbiter global colour mosaic | NASA/JPL/USGS (PIA00407) | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia00/pia00407/PIA00407.jpg | Padded with black so the polar cap clears the edge, scaled to 1600 px. NASA notes the colour is stretched. |
| `eagle.webp` | Eagle on the Moon, Aldrin unloading an experiment; photo by Armstrong | NASA (AS11-40-5927) | https://images.nasa.gov/details/as11-40-5927 | Scaled to 2000 px. |
| `ingenuity.webp` | Ingenuity on Mars, 5 Apr 2021, seen by Perseverance's Mastcam-Z | NASA/JPL-Caltech/ASU (PIA24547) | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia24/pia24547/PIA24547.jpg | WebP only. |
| `insight.webp` | InSight's final selfie, 24 Apr 2022 | NASA/JPL-Caltech (PIA25287) | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia25/pia25287/PIA25287.jpg | Scaled to 2400 px; shown whole on black so the mosaic gaps blend with space. |
| `sojourner.webp` | Sojourner near "The Dice", seen by the Pathfinder lander, sol 22 | NASA/JPL (PIA01122) | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia01/pia01122/PIA01122.jpg | WebP only. |

## Ingenuity chapter photos (downloaded 14 Nov 2026)

| File | What | Credit | Source | Changes |
|---|---|---|---|---|
| `jezero-ground-wide.webp`, `jezero-ground-narrow.webp` | Mastcam-Z 360° view of Van Zyl Overlook, where Perseverance parked for Ingenuity's first flights (PIA24663) | NASA/JPL-Caltech/ASU/MSSS | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia24/pia24663/PIA24663.jpg | Cropped to the ground band below the horizon (middle part of the 360°, no mosaic gaps); 6000 px and 2400 px wide. Also used as the full-screen pan in step 2. |
| `ingenuity-belly.webp` | WATSON view of Ingenuity on Perseverance's belly, 25 Mar 2021 (PIA24424) | NASA/JPL-Caltech/MSSS | https://assets.science.nasa.gov/content/dam/science/psd/mars/downloadable_items/4/5/45906_PIA24424-full.jpg | Black mosaic edge cropped; 2400 px. |
| `ingenuity-first-flight.webp` | First flight recorded by Mastcam-Z, 19 Apr 2021 (PIA24550) | NASA/JPL-Caltech/ASU/MSSS | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia24/pia24550/PIA24550.jpg | WebP only. |
| `ingenuity-swatch.webp` | Wright Flyer swatch on a cable under the solar panel, JPL clean room, 15 Jan 2020 (PIA24291) | NASA/JPL-Caltech | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia24/pia24291/PIA24291.jpg | 2400 px. |
| `ingenuity-aerial.webp` | First aerial colour image of Mars, flight 2 (PIA24593) | NASA/JPL-Caltech | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia24/pia24593/PIA24593.jpg | 2400 px. |
| `ingenuity-blade-shadow.webp` | Shadow of the damaged rotor blade after flight 72 (PIA26243) | NASA/JPL-Caltech | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia26/pia26243/PIA26243.jpg | 2400 px. |
| `ingenuity-final-airfield.webp` | Perseverance spots Ingenuity at its final airfield, 4 Feb 2024 (PIA26236) | NASA/JPL-Caltech/ASU/MSSS | https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia26/pia26236/PIA26236.jpg | Black mosaic edges cropped; 2800 px. |

