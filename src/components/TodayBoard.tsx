import type { Habit, SideQuest } from '../types';

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
  return (
    <section className="panel grid-span-2">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Today</p>
          <h2>Mission Board</h2>
        </div>
        <span className="badge">BearMode Active</span>
      </div>

      <label className="field">
        Main Mission
        <textarea
          value={mainMission}
          onChange={(event) => onMissionChange(event.target.value)}
          placeholder="What is the one win that makes today count?"
        />
      </label>

      <div className="split">
        <QuestList
          title="Side Quests"
          placeholder="Add a side quest..."
          items={sideQuests}
          onAdd={onAddSideQuest}
          onToggle={onToggleSideQuest}
        />

        <div className="mini-panel">
          <h3>Habits</h3>
          <InlineAdd placeholder="Add a habit..." onAdd={onAddHabit} />
          <div className="list">
            {habits.map((habit) => (
              <div key={habit.id} className="habit-row">
                <strong>{habit.title}</strong>
                <select value={habit.mode} onChange={(event) => onHabitMode(habit.id, event.target.value as Habit['mode'])}>
                  <option value="none">Not yet</option>
                  <option value="minimum">Minimum win</option>
                  <option value="full">Full win</option>
                  <option value="recovery">Recovery win</option>
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
  return (
    <div className="mini-panel">
      <h3>{title}</h3>
      <InlineAdd placeholder={placeholder} onAdd={onAdd} />
      <div className="list">
        {items.map((item) => (
          <label key={item.id} className="check-row">
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
    <form className="inline-add" action={submit}>
      <input name="title" placeholder={placeholder} />
      <button type="submit">Add</button>
    </form>
  );
}
