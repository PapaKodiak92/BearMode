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

export const unhingedBearLines = {
  morning: [
    "ROOOAR. Pick the damn mission and quit orbiting it.",
    "Kodiak is awake. Do one useful thing before your excuses start breeding.",
    "Open the board, pick the win, and stop negotiating with bullshit."
  ],
  focus: [
    "One task. No wandering. Don't make Kodiak come back over here.",
    "Lock the hell in. Twenty-five minutes. No side quests in your brain.",
    "You said this mattered. Prove it, or admit you're just decorating the app."
  ],
  drift: [
    "You drifted. Cool. Quit making it a whole damn identity and restart.",
    "The task is too big or you're dodging it. Cut that shit in half and move.",
    "Stop spiraling. Five minutes. One action. Drag your ass back on mission."
  ],
  win: [
    "Good shit. That's proof.",
    "Finally. A win. Stack another before your brain starts acting stupid again.",
    "There we go. You did the damn thing. Protect the next block."
  ]
};

type BearLineBucket = keyof typeof bearLines;

function getSavedCoachStyle(): 'calm' | 'firm' | 'unhinged' {
  if (typeof window === 'undefined') return 'firm';

  try {
    const savedState = window.localStorage.getItem('bearmode:mvp-state');
    if (!savedState) return 'firm';

    const parsedState = JSON.parse(savedState) as { profile?: { coachStyle?: string } };
    return parsedState.profile?.coachStyle === 'unhinged' ? 'unhinged' : 'firm';
  } catch {
    return 'firm';
  }
}

export function randomBearLine(bucket: BearLineBucket): string {
  const style = getSavedCoachStyle();
  const lines = style === 'unhinged' ? unhingedBearLines[bucket] : bearLines[bucket];
  return lines[Math.floor(Math.random() * lines.length)];
}
