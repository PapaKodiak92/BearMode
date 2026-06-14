export type SideQuest = {
  id: string;
  title: string;
  done: boolean;
};

export type Habit = {
  id: string;
  title: string;
  mode: 'none' | 'minimum' | 'full' | 'recovery';
};

export type WinLog = {
  id: string;
  title: string;
  timestamp: string;
  type: 'mission' | 'sideQuest' | 'habit' | 'driftReset' | 'focus';
};

export type BearModeState = {
  mainMission: string;
  sideQuests: SideQuest[];
  habits: Habit[];
  focusMinutes: number;
  driftReason: string;
  resetAction: string;
  wins: WinLog[];
};
