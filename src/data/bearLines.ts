export const bearLines = {
  morning: [
    "ROOOAR. What's the mission today?",
    "Pick the one win that makes today count.",
    "BearMode starts with one clear mission."
  ],
  focus: [
    "One task. No wandering. Move.",
    "Block the noise. Stack the win.",
    "You said this matters. Prove it for the next block."
  ],
  drift: [
    "You slipped. Doesn't matter. Shrink the task and restart.",
    "No spiral. One tiny action gets you back on mission.",
    "Cut the mission down until it is impossible to dodge."
  ],
  win: [
    "Win stacked.",
    "That's proof. Stack another.",
    "Good. Now protect the next block."
  ]
};

export function randomBearLine(bucket: keyof typeof bearLines): string {
  const lines = bearLines[bucket];
  return lines[Math.floor(Math.random() * lines.length)];
}
