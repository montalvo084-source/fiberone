import { useState, useMemo, useRef, useEffect } from 'react';
import { useConfetti } from './Confetti.jsx';

const DAILY_GOAL = 25;

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function GoalRing({ total, goal }) {
  const pct = Math.min(total / goal, 1);
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const dash = pct * circ;
  const isHit = total >= goal;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#d1fae5" strokeWidth="12" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={isHit ? '#059669' : '#10b981'}
            strokeWidth="12"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${isHit ? 'text-emerald-700' : 'text-emerald-600'}`}>
            {total.toFixed(1)}g
          </span>
          <span className="text-xs text-emerald-400">of {goal}g</span>
        </div>
      </div>
      {isHit && (
        <span className="text-emerald-600 font-semibold text-sm animate-bounce">
          🎉 Goal crushed!
        </span>
      )}
    </div>
  );
}

export default function DailyLog({ foods, logs, selectedDate, setSelectedDate, onLogAdded, onLogRemoved }) {
  const [selectedFood, setSelectedFood] = useState('');
  const [servings, setServings] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const prevTotal = useRef(0);
  const { triggerLog, triggerGoal } = useConfetti();

  const dayLogs = useMemo(
    () => logs.filter(l => l.date === selectedDate),
    [logs, selectedDate]
  );

  const total = useMemo(
    () => dayLogs.reduce((sum, l) => sum + l.fiber, 0),
    [dayLogs]
  );

  useEffect(() => {
    prevTotal.current = total;
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleLog(e) {
    e.preventDefault();
    if (!selectedFood || !servings) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodId: selectedFood, servings: parseFloat(servings), date: selectedDate }),
      });
      const entry = await res.json();
      const oldTotal = prevTotal.current;
      const newTotal = oldTotal + entry.fiber;
      prevTotal.current = newTotal;

      if (oldTotal < DAILY_GOAL && newTotal >= DAILY_GOAL) {
        triggerGoal();
        showToast(`🏆 Daily goal hit! ${newTotal.toFixed(1)}g total`);
      } else {
        triggerLog();
        showToast(`+${entry.fiber}g fiber logged!`);
      }

      setServings('1');
      onLogAdded();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id) {
    const entry = dayLogs.find(l => l.id === id);
    await fetch(`/api/logs/${id}`, { method: 'DELETE' });
    prevTotal.current = Math.max(0, prevTotal.current - (entry?.fiber || 0));
    onLogRemoved();
  }

  function changeDate(offset) {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d + offset);
    setSelectedDate(date.toISOString().slice(0, 10));
  }

  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg font-medium text-sm animate-bounce">
          {toast}
        </div>
      )}

      {/* Date nav */}
      <div className="card flex items-center justify-between">
        <button onClick={() => changeDate(-1)} className="btn-ghost text-xl px-2">‹</button>
        <div className="text-center">
          <p className="font-semibold text-emerald-800">{formatDate(selectedDate)}</p>
          {!isToday && (
            <button onClick={() => setSelectedDate(today)} className="text-xs text-emerald-400 hover:text-emerald-600 underline">
              Back to today
            </button>
          )}
        </div>
        <button
          onClick={() => changeDate(1)}
          disabled={selectedDate >= today}
          className="btn-ghost text-xl px-2 disabled:opacity-30"
        >›</button>
      </div>

      {/* Goal ring + log form */}
      <div className="card flex flex-col sm:flex-row gap-6 items-center">
        <GoalRing total={total} goal={DAILY_GOAL} />

        <form onSubmit={handleLog} className="flex-1 space-y-3 w-full">
          <div>
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 block">Food</label>
            <select
              value={selectedFood}
              onChange={e => setSelectedFood(e.target.value)}
              className="input"
              required
            >
              <option value="">Pick a food...</option>
              {foods.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.fiber}g fiber
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 block">Servings</label>
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={servings}
              onChange={e => setServings(e.target.value)}
              className="input"
              required
            />
          </div>
          <button type="submit" disabled={submitting || !selectedFood} className="btn-primary w-full">
            {submitting ? 'Logging…' : '+ Log It'}
          </button>
        </form>
      </div>

      {/* Log entries */}
      <div className="card">
        <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-4">
          Today's Entries
          {dayLogs.length > 0 && (
            <span className="ml-2 bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-xs">
              {dayLogs.length}
            </span>
          )}
        </h2>

        {dayLogs.length === 0 ? (
          <p className="text-emerald-300 text-sm text-center py-6">
            Nothing logged yet — add your first food above!
          </p>
        ) : (
          <ul className="space-y-2">
            {dayLogs.map(entry => (
              <li key={entry.id} className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-medium text-emerald-900 text-sm">{entry.foodName}</p>
                  <p className="text-xs text-emerald-500">
                    {entry.servings} serving{entry.servings !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 text-sm">{entry.fiber}g</span>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="btn-danger"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
            <li className="flex justify-between px-4 py-2 border-t border-emerald-100 mt-2">
              <span className="text-sm font-semibold text-emerald-700">Total</span>
              <span className="font-bold text-emerald-700">{total.toFixed(1)}g</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
