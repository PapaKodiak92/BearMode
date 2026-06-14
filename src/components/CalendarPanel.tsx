import { useState, type FormEvent } from 'react';
import type { CalendarItem } from '../types';

type CalendarPanelProps = {
  items: CalendarItem[];
  onAdd: (item: Omit<CalendarItem, 'id'>) => void;
  onRemove: (id: string) => void;
};

const today = new Date().toISOString().slice(0, 10);

export function CalendarPanel({ items, onAdd, onRemove }: CalendarPanelProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today);
  const [type, setType] = useState<CalendarItem['type']>('mission');

  const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onAdd({ title: trimmedTitle, date, type });
    setTitle('');
  }

  return (
    <section className="panel grid-span-2 calendar-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>Mission Schedule</h2>
          <p className="muted">Block the day before the day blocks you.</p>
        </div>
        <span className="badge">{items.length} blocks</span>
      </div>

      <form className="calendar-form" onSubmit={submit}>
        <label className="field">
          What needs a block?
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Workout, podcast, coding sprint..." />
        </label>
        <label className="field">
          Date
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <label className="field">
          Type
          <select value={type} onChange={(event) => setType(event.target.value as CalendarItem['type'])}>
            <option value="mission">Mission</option>
            <option value="focus">Focus block</option>
            <option value="habit">Habit</option>
            <option value="review">Review</option>
          </select>
        </label>
        <button type="submit">Add Block</button>
      </form>

      <div className="calendar-list">
        {sortedItems.length === 0 ? (
          <div className="empty-card">No blocks yet. Put one win on the calendar.</div>
        ) : sortedItems.map((item) => (
          <div key={item.id} className="calendar-item">
            <div>
              <strong>{item.title}</strong>
              <span>{formatDate(item.date)} · {formatType(item.type)}</span>
            </div>
            <button className="secondary" onClick={() => onRemove(item.id)}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatType(type: CalendarItem['type']) {
  switch (type) {
    case 'focus': return 'Focus block';
    case 'habit': return 'Habit';
    case 'review': return 'Review';
    default: return 'Mission';
  }
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}
