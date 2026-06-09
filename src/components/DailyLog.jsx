import { useState, useMemo, useRef, useEffect } from 'react';
import { useConfetti } from './Confetti.jsx';

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

const SERVING_PRESETS = [
  { value: '0.5', label: '½' },
  { value: '1', label: '1' },
  { value: '1.5', label: '1½' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
];

export default function DailyLog({ foods, logs, selectedDate, setSelectedDate, onLogAdded, onLogRemoved, dailyGoal }) {
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

  const weeklyGoal = dailyGoal * 7;

  const weeklyTotal = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const anchor = new Date(y, m - 1, d);
    const day = anchor.getDay();
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() - ((day + 6) % 7));
    const weekDates = new Set(
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        return date.toISOString().slice(0, 10);
      })
    );
    return logs.filter(l => weekDates.has(l.date)).reduce((s, l) => s + l.fiber, 0);
  }, [logs, selectedDate]);

  useEffect(() => {
    prevTotal.current = total;
  }, []);

  const selectedFoodObj = foods.find(f => f.id === selectedFood);

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

      if (oldTotal < dailyGoal && newTotal >= dailyGoal) {
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

      {/* Weekly mini-banner */}
      <div className="bg-emerald-100 rounded-xl px-4 py-2.5 flex items-center gap-3">
        <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">This week</span>
        <div className="flex-1 bg-emerald-200 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(weeklyTotal / weeklyGoal, 1) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
          {weeklyTotal.toFixed(1)}g / {weeklyGoal}g
        </span>
      </div>

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
        <GoalRing total={total} goal={dailyGoal} />

        <form onSubmit={handleLog} className="flex-1 space-y-4 w-full">
          {/* Food selection */}
          {!selectedFood ? (
            <div>
              <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 block">
                Choose a Food
              </label>
              {foods.length === 0 ? (
                <p className="text-sm text-emerald-300 text-center py-4">
                  No foods yet — add some in the Foods tab
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {foods.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => { setSelectedFood(f.id); setServings('1'); }}
                      className="text-left px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 transition-all duration-150"
                    >
                      <p className="font-medium text-emerald-900 text-sm leading-tight">{f.name}</p>
                      <p className="text-xs text-emerald-500 mt-0.5">{f.fiber}g / serving</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Selected food chip */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 bg-emerald-500 text-white px-3 py-2 rounded-xl">
                  <span className="font-semibold text-sm">{selectedFoodObj?.name}</span>
                  <span className="text-emerald-200 text-xs">{selectedFoodObj?.fiber}g/serving</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFood('')}
                  className="text-xs text-emerald-400 hover:text-emerald-600 underline"
                >
                  Change
                </button>
              </div>

              {/* Serving presets */}
              <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 block">
                Servings
              </label>
              <div className="flex gap-2 flex-wrap">
                {SERVING_PRESETS.map(s => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setServings(s.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 active:scale-95 ${
                      servings === s.value
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-emerald-200 text-emerald-700 hover:border-emerald-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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
