import type { Habit, SideQuest } from '../types';
import './TodayBoard.css';

type TodayBoardProps = {
  mainMission: string;
  sideQuests: SideQuest[];
  habits: Habit[];
  onMissionChange: (value: string) => void;
  onAddSideQuest: (title: string) => void;
  onToggleSideQuest: (id: string) => void;
  onAddHabit: (title: string) => void;
  onHabitMode: (id: string, mode: Habit['mode']) => void;
};

export function TodayBoard({
  mainMission,
  sideQuests,
  habits,
  onMissionChange,
  onAddSideQuest,
  onToggleSideQuest,
  onAddHabit,
  onHabitMode
}: TodayBoardProps) {
  const completedSideQuests = sideQuests.filter((quest) => quest.done).length;
  const completedHabits = habits.filter((habit) => habit.mode !== 'none').length;

  return (
    <section className="panel mission-board-card">
      <div className="mission-board-header">
        <div>
          <p className="eyebrow">Mission</p>
          <h2>Today Board</h2>
        </div>
        <div className="mission-board-score" aria-label="Today progress">
          <span>{completedSideQuests}/{sideQuests.length} quests</span>
          <span>{completedHabits}/{habits.length} habits</span>
        </div>
      </div>

      <label className="field compact-mission-field">
        Main Mission
        <textarea
          className="mission-textarea"
          rows={2}
          value={mainMission}
          onChange={(event) => onMissionChange(event.target.value)}
          placeholder="What is the one win that makes today count?"
        />
      </label>

      <div className="mission-columns">
        <QuestList
          title="Side Quests"
          placeholder="Add a side quest..."
          items={sideQuests}
          onAdd={onAddSideQuest}
          onToggle={onToggleSideQuest}
        />

        <div className="mini-panel mission-subpanel">
          <div className="mission-subpanel-header">
            <h3>Habits</h3>
            <span>{completedHabits}/{habits.length}</span>
          </div>
          <InlineAdd placeholder="Add a habit..." onAdd={onAddHabit} />
          <div className="list mission-list">
            {habits.map((habit) => (
              <div key={habit.id} className="habit-row compact-row">
                <strong>{habit.title}</strong>
                <select value={habit.mode} onChange={(event) => onHabitMode(habit.id, event.target.value as Habit['mode'])}>
                  <option value="none">Not yet</option>
                  <option value="minimum">Minimum</option>
                  <option value="full">Full</option>
                  <option value="recovery">Recovery</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function QuestList({
  title,
  placeholder,
  items,
  onAdd,
  onToggle
}: {
  title: string;
  placeholder: string;
  items: SideQuest[];
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
}) {
  const completed = items.filter((item) => item.done).length;

  return (
    <div className="mini-panel mission-subpanel">
      <div className="mission-subpanel-header">
        <h3>{title}</h3>
        <span>{completed}/{items.length}</span>
      </div>
      <InlineAdd placeholder={placeholder} onAdd={onAdd} />
      <div className="list mission-list">
        {items.map((item) => (
          <label key={item.id} className="check-row compact-row">
            <input type="checkbox" checked={item.done} onChange={() => onToggle(item.id)} />
            <span className={item.done ? 'done' : ''}>{item.title}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function InlineAdd({ placeholder, onAdd }: { placeholder: string; onAdd: (title: string) => void }) {
  function submit(formData: FormData) {
    const title = String(formData.get('title') ?? '').trim();
    if (title.length > 0) {
      onAdd(title);
    }
  }

  return (
    <form className="inline-add compact-inline-add" action={submit}>
      <input name="title" placeholder={placeholder} />
      <button type="submit">Add</button>
    </form>
  );
}
