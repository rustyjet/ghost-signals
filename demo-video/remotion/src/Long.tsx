import React from "react";
import { AbsoluteFill, Composition, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Caption, Clip, EndCard, FutureStill, TeamIntro, Watermark, clamp } from "./Composition";

// The long demo (about 3 minutes): the same Space Apps guide as the 30-second video, with time to show
// every chapter and every game. Footage in public/long/: scroll takes captured frame by frame from the built
// site (demo-video/capture/capture.mjs), the laser game played by script, the other games recorded by the team.

const FPS = 30;
const T = 9; // crossfade frames
const s = (sec: number) => Math.round(sec * FPS);
type Align = "bottom" | "top-right" | "top-left" | "bottom-right";

type Cap = { head: string; body: string; align?: Align; maxWidth?: number };
/** One clip: source, where to start in it (seconds) and how fast to play it. */
type Shot = { src: string; from?: number; rate?: number };

type Beat = { name: string; sec: number; cap?: Cap } & (
  | { kind: "team" }
  | { kind: "clip"; shot: Shot }
  // A chapter: its opening on the 3D model, then one step of the story, under one caption.
  | { kind: "story"; open: Shot; openSec: number; step: Shot }
  | { kind: "future" }
  | { kind: "end" }
);

const Shot: React.FC<{ shot: Shot }> = ({ shot }) => (
  <Clip src={`long/${shot.src}`} from={s(shot.from ?? 0)} rate={shot.rate ?? 1} />
);

const story = (slug: string, cap: Cap, step: "a" | "b"): Beat => ({
  name: `${slug} story`,
  kind: "story",
  sec: 11,
  // From 0.5 s: the first frames show the title before its entrance replays after the reload.
  open: { src: `${slug}-open.mp4`, from: 0.5, rate: 1.25 },
  openSec: 6,
  step: { src: `${slug}-${step}.mp4` },
  cap,
});

const BEATS: Beat[] = [
  // 0:00 Introduce yourself
  { name: "Team", kind: "team", sec: 6 },
  // 0:06 Lead us in: the challenge, and why
  {
    name: "Challenge",
    kind: "clip",
    sec: 8,
    shot: { src: "hub.mp4", from: 5 },
    cap: {
      head: "Our challenge: Abandoned but not Forgotten.",
      body: "NASA left machines on the Moon and Mars. They did amazing work, then went silent.",
    },
  },
  {
    name: "Why",
    kind: "clip",
    sec: 7,
    shot: { src: "hub.mp4", from: 13, rate: 1.07 },
    cap: {
      head: "Every one of them has a story.",
      body: "We wanted kids to hear it, told by the machine itself.",
    },
  },
  // Name the project
  {
    name: "Ghost Signals",
    kind: "clip",
    sec: 8,
    shot: { src: "hub.mp4", from: 0, rate: 0.63 },
    cap: {
      head: "Ghost Signals",
      body: "A scrolling story where NASA's silent machines tell their own stories. For readers aged 9 to 14.",
    },
  },
  // Describe the idea: how it works
  {
    name: "Scroll to travel",
    kind: "clip",
    sec: 8,
    shot: { src: "hub.mp4", from: 20.5, rate: 1.44 },
    cap: { head: "Scroll to travel.", body: "Scrolling down flies you out from Earth, past the Moon, to Mars." },
  },
  {
    name: "Stops",
    kind: "clip",
    sec: 8,
    shot: { src: "hub.mp4", from: 32, rate: 2 },
    cap: {
      head: "Each silent machine is a stop.",
      body: "Open one and its chapter begins, on NASA's own 3D model and real NASA photos.",
    },
  },
  // The five chapters, each with its game
  story("opportunity", { head: "Opportunity", body: "Built for 90 days on Mars. It lasted 5,111." }, "a"),
  {
    name: "Last Light",
    kind: "clip",
    sec: 11,
    shot: { src: "lastlight-game.mp4", from: 1, rate: 4 },
    cap: {
      head: "Last Light: survive a dust storm.",
      body: "Drive to rocks, and choose when to run the heaters and the radio.",
      align: "top-right",
      maxWidth: 1000,
    },
  },
  story("ingenuity", { head: "Ingenuity", body: "Allowed five flights. It flew 72." }, "b"),
  {
    name: "Lift off",
    kind: "clip",
    sec: 11,
    shot: { src: "ingenuity-game.mp4", rate: 3.8 },
    cap: {
      head: "Lift off: fly in thin Mars air.",
      body: "The blades spin about 2,400 times a minute. Then try Earth air.",
      align: "top-left",
      maxWidth: 820,
    },
  },
  story("eagle", { head: "Eagle", body: "Apollo 11's lunar module. Half of it stayed on the Moon." }, "a"),
  {
    name: "Find the mirrors",
    kind: "clip",
    sec: 12,
    shot: { src: "eagle-game.mp4", from: 1 },
    cap: {
      head: "Find the mirrors: fire a laser at the Moon.",
      // Bottom right, over the Moon's empty south: the stopwatch and the "Mirrors found" row on the left stay clear.
      body: "The light takes about 2.5 seconds to come back.",
      align: "bottom-right",
    },
  },
  story("insight", { head: "InSight", body: "It stayed in one spot for four years, listening to Mars." }, "a"),
  {
    name: "Marsquakes",
    kind: "clip",
    sec: 12,
    shot: { src: "insight-game.mp4", rate: 1.15 },
    cap: {
      head: "Listen for marsquakes.",
      body: "The wind hides them until you put the dome over the seismometer.",
      align: "top-right",
      maxWidth: 900,
    },
  },
  story("sojourner", { head: "Sojourner", body: "The first rover on Mars. Built for a week, it kept going for 83 days." }, "a"),
  {
    name: "Plan my drive",
    kind: "clip",
    sec: 12,
    shot: { src: "sojourner-game.mp4", rate: 2.2 },
    cap: {
      head: "Plan my drive.",
      body: "Commands took 10 to 15 minutes to reach Mars, so you plan the day and it drives itself.",
      // Bottom right, over the lander's petal: the rover drives up and away from it, towards Yogi at the top.
      align: "bottom-right",
      maxWidth: 900,
    },
  },
  // How NASA data made it possible
  {
    name: "Sources",
    kind: "clip",
    sec: 8,
    // From 2.5 s: before that the take still shows the game's "Your turn" screen.
    shot: { src: "sources.mp4", from: 2.5, rate: 0.55 },
    cap: {
      head: "Every number is checked.",
      body: "About 200 facts, each matched to a NASA, JPL or NSSDCA page and listed in every chapter.",
    },
  },
  {
    name: "NASA material",
    kind: "clip",
    sec: 7,
    shot: { src: "opportunity-b.mp4", rate: 0.72 },
    cap: {
      head: "All real NASA material.",
      body: "4 NASA 3D models and more than 50 NASA photos. No AI-made pictures.",
    },
  },
  {
    name: "AI use",
    kind: "clip",
    sec: 7,
    shot: { src: "insight-b.mp4", rate: 0.72 },
    cap: {
      head: "Built with Claude Code.",
      body: "An AI assistant wrote most of the code with us. Our team chose the stories and checked every fact.",
    },
  },
  // Look into the future
  { name: "Future", kind: "future", sec: 7 },
  {
    name: "Never forgotten",
    kind: "clip",
    sec: 7,
    shot: { src: "lastlight-game.mp4", from: 97 },
    cap: {
      head: "Next: more machines, and more classrooms.",
      body: "So the explorers we left behind are never forgotten.",
      align: "top-right",
      maxWidth: 1000,
    },
  },
  { name: "End", kind: "end", sec: 5 },
];

const LEN = BEATS.map((b) => s(b.sec));
export const LONG_TOTAL = LEN.reduce((a, b) => a + b, 0) - (BEATS.length - 1) * T;
/** Frame where each beat starts in the finished video. */
const START = LEN.map((_, i) => LEN.slice(0, i).reduce((a, b) => a + b, 0) - i * T);

const BeatView: React.FC<{ b: Beat }> = ({ b }) => {
  const cap = b.cap && <Caption head={b.cap.head} body={b.cap.body} align={b.cap.align} maxWidth={b.cap.maxWidth} />;
  switch (b.kind) {
    case "team":
      return <TeamIntro />;
    case "future":
      return (
        <FutureStill
          head="What it can do: open NASA's data to everyone."
          body="Real missions become stories anyone with a phone can feel."
        />
      );
    case "end":
      return (
        <AbsoluteFill>
          <EndCard />
          <Watermark />
        </AbsoluteFill>
      );
    case "clip":
      return (
        <AbsoluteFill>
          <Shot shot={b.shot} />
          {cap}
          <Watermark />
        </AbsoluteFill>
      );
    case "story":
      return (
        <AbsoluteFill>
          <Sequence durationInFrames={s(b.openSec)}>
            <Shot shot={b.open} />
          </Sequence>
          <Sequence from={s(b.openSec)}>
            <Shot shot={b.step} />
          </Sequence>
          {cap}
          <Watermark />
        </AbsoluteFill>
      );
  }
};

const Sound: React.FC = () => {
  const { fps } = useVideoConfig();
  const i = BEATS.findIndex((b) => b.name === "insight story");
  const from = START[i];
  const len = START[i + 2] - from + T;
  return (
    <>
      {/* The 30-second video's music bed, looped with crossfades to cover the long cut */}
      <Audio
        src={staticFile("long/music-long.wav")}
        volume={(f) => interpolate(f, [0, 0.5 * fps, LONG_TOTAL - 2 * fps, LONG_TOTAL], [0, 0.6, 0.6, 0], clamp)}
      />
      {/* NASA/JPL-Caltech: Mars wind heard by InSight's seismometer, under the InSight chapter and its game */}
      <Sequence name="InSight wind" from={from} durationInFrames={len}>
        <Audio
          src={staticFile("insight-wind.wav")}
          loop
          volume={(f) => interpolate(f, [0, 30, len - 30, len], [0, 0.14, 0.14, 0], clamp)}
        />
      </Sequence>
    </>
  );
};

export const Long: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <TransitionSeries>
      {BEATS.flatMap((b, i) => [
        ...(i > 0
          ? [<TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: T })} />]
          : []),
        <TransitionSeries.Sequence key={b.name} name={b.name} durationInFrames={LEN[i]}>
          <BeatView b={b} />
        </TransitionSeries.Sequence>,
      ])}
    </TransitionSeries>
    <Sound />
  </AbsoluteFill>
);

export const LongComposition = () => (
  <Composition id="GhostSignalsLong" component={Long} durationInFrames={LONG_TOTAL} fps={FPS} width={1920} height={1080} />
);
