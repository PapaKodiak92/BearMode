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

export type BearModeProfile = {
  displayName: string;
  identity: string;
  reason: string;
  desiredChange: string;
  coachStyle: 'calm' | 'firm' | 'unhinged';
};

export type CalendarItem = {
  id: string;
  title: string;
  date: string;
  type: 'mission' | 'focus' | 'habit' | 'review';
};

export type BearModeState = {
  onboardingComplete: boolean;
  profile: BearModeProfile;
  mainMission: string;
  sideQuests: SideQuest[];
  habits: Habit[];
  focusMinutes: number;
  driftReason: string;
  resetAction: string;
  wins: WinLog[];
  calendarItems: CalendarItem[];
};
