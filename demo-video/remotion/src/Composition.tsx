import React from "react";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Audio, Video } from "@remotion/media";
import { Sequence } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/fonts";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// The site's own type and colours (src/index.css): Bricolage Grotesque for display,
// Atkinson Hyperlegible Next for reading, pale Mars sun on storm brown.
loadFont({ family: "Bricolage", url: staticFile("bricolage.woff2"), weight: "200 800" });
loadFont({ family: "Atkinson", url: staticFile("atkinson.woff2"), weight: "200 800" });

const SUN = "#f2e2c2";
const STORM = "20, 12, 8";
const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const T = 9; // crossfade frames

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const { fontFamily: INTER } = loadInter("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
const ACCENT = "#3d7bff";

/** Headline whose words rise out of a mask one after another, then a body line fades up. */
const Caption: React.FC<{
  head: string;
  body: string;
  align?: "bottom" | "top-right";
  delay?: number;
}> = ({ head, body, align = "bottom", delay = 6 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const top = align === "top-right";
  // Narrator card: a neutral typeface and a white card, so it never reads as part of the site.
  return (
    <div
      style={{
        position: "absolute",
        left: top ? undefined : 80,
        right: top ? 80 : undefined,
        bottom: top ? undefined : 80,
        top: top ? 150 : undefined,
        display: "flex",
        background: "#ffffff",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
        clipPath: `inset(0% ${interpolate(frame, [delay, delay + 14], [100, 0], { ...clamp, easing: OUT })}% 0% 0% round 18px)`,
        opacity: interpolate(frame, [durationInFrames - 10, durationInFrames - 2], [1, 0], clamp),
      }}
    >
      <div style={{ width: 12, background: ACCENT, flexShrink: 0 }} />
      <div
        style={{
          padding: "26px 40px 28px 30px",
          maxWidth: 1250,
          translate: interpolate(frame, [delay + 4, delay + 18], ["-16px 0px", "0px 0px"], { ...clamp, easing: OUT }),
          opacity: interpolate(frame, [delay + 4, delay + 16], [0, 1], clamp),
        }}
      >
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 60, lineHeight: 1.08, letterSpacing: "-0.025em", color: "#0d1117" }}>
          {head}
        </div>
        <div style={{ fontFamily: INTER, fontWeight: 400, fontSize: 32, lineHeight: 1.35, marginTop: 10, color: "#4a5361" }}>
          {body}
        </div>
      </div>
    </div>
  );
};


/** Screen recording with a slow push-in and a scrim so the words read. */
const Clip: React.FC<{ src: string; from?: number; rate?: number }> = ({ src, from = 0, rate = 1 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill
        style={{ scale: interpolate(frame, [0, durationInFrames], [1, 1.035], clamp) }}
      >
        <Video src={staticFile(src)} trimBefore={from} playbackRate={rate} muted style={{ width: "100%", height: "100%" }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Scene: React.FC<{
  src: string;
  head: string;
  body: string;
  top?: boolean;
  from?: number;
  rate?: number;
}> = ({ src, head, body, top, from, rate }) => (
  <AbsoluteFill>
    <Clip src={src} from={from} rate={rate} />
    <Caption head={head} body={body} align={top ? "top-right" : "bottom"} />
    <Watermark />
  </AbsoluteFill>
);

/** 0:00 Introduce yourself: the team picture, scaled down so the caption card sits under the names. */
const TeamIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#07090d" }}>
      <div
        style={{
          position: "absolute",
          left: 240,
          top: 34,
          width: 1440,
          height: 810,
          borderRadius: 16,
          overflow: "hidden",
          scale: interpolate(frame, [0, durationInFrames], [1, 1.03], clamp),
        }}
      >
        <Img src={staticFile("team.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      <Caption head="We're Team Hack Tuah." body="NASA Space Apps 2026, Kuala Lumpur." delay={2} />
      <Watermark small />
    </AbsoluteFill>
  );
};

/** 0:20 Look into the future: what the web app can do. */
const FutureStill: React.FC<{ head: string; body: string }> = ({ head, body }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ scale: interpolate(frame, [0, durationInFrames], [1.06, 1.0], clamp) }}>
        <Img
          src={staticFile("sojourner-pano.webp")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "60% 50%" }}
        />
      </AbsoluteFill>
      <Caption head={head} body={body} />
      <Watermark />
    </AbsoluteFill>
  );
};

const TEAM = [
  "Muhammad Juni Damia bin Jihad",
  "Muhammad Akmal Harith bin Mohd Isa",
  "Aqilah binti Mohd Yani",
  "Syazwin Al-Afiqah binti Mohamad Sawal",
  "Nur Waffiah binti Khairul Tajudin",
];

const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const rise = (from: number) => ({
    opacity: interpolate(frame, [from, from + 14], [0, 1], clamp),
    translate: interpolate(frame, [from, from + 14], ["0px 18px", "0px 0px"], { ...clamp, easing: OUT }),
  });
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ scale: interpolate(frame, [0, durationInFrames], [1.0, 1.06], clamp) }}>
        <Img
          src={staticFile("sojourner-pano.webp")}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "60% 50%" }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(to right, rgba(${STORM},0.9) 0%, rgba(${STORM},0.7) 42%, rgba(${STORM},0.05) 75%)`,
        }}
      />
      <div style={{ position: "absolute", left: 96, top: 120, color: SUN, width: 1100 }}>
        <div
          style={{
            fontFamily: "Bricolage",
            fontWeight: 800,
            fontSize: 150,
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            ...rise(2),
          }}
        >
          Ghost Signals
        </div>
        <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 46, marginTop: 26, ...rise(12) }}>
          rustyjet.github.io/ghost-signals
        </div>
        <div style={{ fontFamily: INTER, fontSize: 30, marginTop: 14, color: "rgba(242,226,194,0.85)", ...rise(18) }}>
          NASA Space Apps 2026. Abandoned but not Forgotten.
        </div>
        <div style={{ marginTop: 64, ...rise(26) }}>
          <div style={{ fontFamily: "Bricolage", fontWeight: 700, fontSize: 40 }}>Team Hack Tuah</div>
          <div
            style={{
              fontFamily: INTER,
              fontSize: 27,
              lineHeight: 1.45,
              marginTop: 10,
              opacity: 0.88,
            }}
          >
            {TEAM.map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Visible SI notice required by Space Apps for AI-assisted video. */
const Watermark: React.FC<{ small?: boolean }> = ({ small }) => (
  <div
    style={{
      position: "absolute",
      top: small ? 10 : 22,
      left: 0,
      right: 0,
      textAlign: "center",
      fontFamily: INTER,
      fontSize: small ? 18 : 21,
      color: SUN,
      opacity: 0.72,
      textShadow: `0 1px 8px rgba(${STORM}, 0.9)`,
    }}
  >
    AI-assisted build (Claude Code). Images, 3D models and sounds from NASA.
  </div>
);

const fadeT = <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: T })} />;

// The Space Apps 30-second guide, step by step. Frame where each step starts:
// 0:00 team (0), 0:02 challenge (60), 0:05 project (150), 0:10 idea (300, 375, 450, 525),
// 0:20 future (600, 705), end card (795). Each length = next start - start + T; the last is 90.
const D = {
  team: 69,
  lead: 99,
  name: 159,
  beat: 59, // six 0:10-0:20 montage beats, one every 50 frames
  future1: 154,
  future2: 134,
};
const SEQUENCES = 3 + 6 + 2;
const TOTAL = D.team + D.lead + D.name + 6 * D.beat + D.future1 + D.future2 - (SEQUENCES - 1) * T; // 879 = 29.3 s

const Sound: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {/* Ambient music bed, made with ffmpeg for this video (no licence needed) */}
      <Audio
        src={staticFile("music-energetic.wav")}
        volume={(f) => interpolate(f, [0, 0.5 * fps, TOTAL - 1.5 * fps, TOTAL], [0, 0.75, 0.75, 0], clamp)}
      />
      {/* NASA/JPL-Caltech: Mars wind heard by InSight's seismometer (under the Mars scenes) */}
      <Sequence name="InSight wind" from={285} durationInFrames={510}>
        <Audio
          src={staticFile("insight-wind.wav")}
          volume={(f) => interpolate(f, [0, 30, 470, 510], [0, 0.12, 0.12, 0], clamp)}
        />
      </Sequence>
    </>
  );
};

export const Demo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence name="0:00 Team" durationInFrames={D.team}>
        <TeamIntro />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence name="0:02 Challenge" durationInFrames={D.lead}>
        <Scene
          src="journey.mp4"
          head="Our challenge: Abandoned but not Forgotten."
          body="These machines did amazing work, then went silent. We want people to hear their stories."
        />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence name="0:05 Project" durationInFrames={D.name}>
        <Scene
          src="title.mp4"
          rate={0.63}
          head="Ghost Signals"
          body="NASA's silent machines tell their own stories."
        />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence name="0:10 Machines" durationInFrames={D.beat}>
        <Scene src="machines.mp4" top head="Scroll past every machine." body="Opportunity, Ingenuity, InSight, Sojourner." />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence name="0:11.7 Model" durationInFrames={D.beat}>
        <Scene src="model.mp4" head="NASA's own 3D models and photos." body="Every number checked against a NASA source." />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence name="0:13.3 Ingenuity" durationInFrames={D.beat}>
        <Scene src="ingenuity-game.mp4" top head="Fly Ingenuity." body="Lift off in thin Mars air." />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence name="0:15 InSight" durationInFrames={D.beat}>
        <Scene src="insight-game.mp4" top head="Catch a marsquake." body="Listen like InSight did." />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence name="0:16.7 Sojourner" durationInFrames={D.beat}>
        <Scene src="sojourner-game.mp4" top head="Plan Sojourner's drive." body="Commands take minutes to reach Mars." />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence name="0:18.3 Last Light" durationInFrames={D.beat}>
        <Scene src="game.mp4" top head="Survive the dust storm." body="Keep Opportunity alive." />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence name="0:20 Future" durationInFrames={D.future1}>
        <FutureStill
          head="What it can do: open NASA's data to everyone."
          body="Real missions become stories anyone with a phone can feel."
        />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence name="0:23 Future" durationInFrames={D.future2}>
        <Scene
          src="game.mp4"
          from={84}
          rate={0.55}
          top
          head="So the explorers we left behind"
          body="are never forgotten."
        />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Sound />
  </AbsoluteFill>
);

export const MyComposition = () => (
  <Composition
    id="GhostSignalsDemo"
    component={Demo}
    durationInFrames={TOTAL}
    fps={30}
    width={1920}
    height={1080}
  />
);
