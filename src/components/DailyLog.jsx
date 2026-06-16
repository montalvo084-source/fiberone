import { useState, useMemo, useRef, useEffect } from 'react';
import { useConfetti } from './Confetti.jsx';

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function GoalDisplay({ total, goal }) {
  const pct = Math.min(total / goal, 1);
  const remaining = Math.max(goal - total, 0);
  const isHit = total >= goal;
  const pctInt = Math.round(pct * 100);

  return (
    <div className="space-y-3">
      <div className="text-center">
        {isHit ? (
          <>
            <div className="text-4xl font-black text-emerald-600 leading-none">Goal Reached!</div>
            <div className="text-sm font-semibold text-emerald-500 uppercase tracking-widest mt-2">100% Complete</div>
          </>
        ) : (
          <>
            <div className="text-5xl font-black text-emerald-800 leading-none">{Math.ceil(remaining)}g</div>
            <div className="text-sm font-semibold text-emerald-400 uppercase tracking-widest mt-1">left today</div>
          </>
        )}
      </div>

      <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${isHit ? 'bg-emerald-600' : 'bg-emerald-400'}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-emerald-500">{total.toFixed(1)}g / {goal}g</span>
        <span className={`font-bold text-sm ${isHit ? 'text-emerald-600' : 'text-emerald-700'}`}>
          {pctInt}% Complete
        </span>
      </div>
    </div>
  );
}

const QUICK_GRAMS = [20, 30, 40];

function QuickAdd({ onAdd, submitting }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customGrams, setCustomGrams] = useState('');

  function submitCustom() {
    const g = parseFloat(customGrams);
    if (g > 0) {
      onAdd(g);
      setCustomGrams('');
      setShowCustom(false);
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 block">
        Quick Add
      </label>
      <div className="flex gap-2 flex-wrap">
        {QUICK_GRAMS.map(g => (
          <button
            key={g}
            type="button"
            disabled={submitting}
            onClick={() => onAdd(g)}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 active:scale-95 transition-all disabled:opacity-50"
          >
            +{g}g
          </button>
        ))}
        <button
          type="button"
          disabled={submitting}
          onClick={() => setShowCustom(v => !v)}
          className={`px-4 py-2 rounded-xl text-sm font-bold border active:scale-95 transition-all disabled:opacity-50 ${
            showCustom
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-white text-emerald-600 border-emerald-300 hover:border-emerald-500'
          }`}
        >
          Custom
        </button>
      </div>
      {showCustom && (
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            value={customGrams}
            onChange={e => setCustomGrams(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submitCustom()}
            placeholder="Enter grams"
            min="0.1"
            step="0.1"
            className="flex-1 rounded-xl border border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
            autoFocus
          />
          <button
            type="button"
            onClick={submitCustom}
            disabled={!customGrams || parseFloat(customGrams) <= 0}
            className="btn-primary px-4"
          >
            Add
          </button>
        </div>
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

function getMilestoneMessage(oldTotal, newTotal, goal) {
  const oldPct = oldTotal / goal;
  const newPct = Math.min(newTotal / goal, 2);
  if (newPct >= 1 && oldPct < 1) return { text: '🏆 Goal Achieved!', isGoal: true };
  if (newPct >= 0.75 && oldPct < 0.75) return { text: '75% Complete! Almost there!', isGoal: false };
  if (newPct >= 0.5 && oldPct < 0.5) return { text: 'Halfway There! Keep it up!', isGoal: false };
  if (newPct >= 0.25 && oldPct < 0.25) return { text: '25% Done! Great start!', isGoal: false };
  return null;
}

export default function DailyLog({ foods, logs, selectedDate, setSelectedDate, onLogAdded, onLogRemoved, dailyGoal }) {
  const [selectedFood, setSelectedFood] = useState('');
  const [servings, setServings] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const prevTotal = useRef(0);
  const { triggerLog, triggerGoal, triggerMilestone } = useConfetti();

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
  }, [selectedDate]);

  const selectedFoodObj = foods.find(f => f.id === selectedFood);

  function showToast(msg, isGoal = false) {
    setToast({ msg, isGoal });
    setTimeout(() => setToast(null), 3000);
  }

  function applyMilestoneOrLog(oldTotal, newTotal, fiberAmount) {
    const milestone = getMilestoneMessage(oldTotal, newTotal, dailyGoal);
    if (milestone) {
      if (milestone.isGoal) triggerGoal();
      else triggerMilestone();
      showToast(milestone.text, milestone.isGoal);
    } else {
      triggerLog();
      showToast(`+${fiberAmount}g fiber logged!`);
    }
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
      applyMilestoneOrLog(oldTotal, newTotal, entry.fiber);
      setServings('1');
      onLogAdded();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuickAdd(grams) {
    setSubmitting(true);
    try {
      const res = await fetch('/api/logs/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grams, date: selectedDate }),
      });
      const entry = await res.json();
      const oldTotal = prevTotal.current;
      const newTotal = oldTotal + entry.fiber;
      prevTotal.current = newTotal;
      applyMilestoneOrLog(oldTotal, newTotal, entry.fiber);
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
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm animate-bounce ${
          toast.isGoal
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
            : 'bg-emerald-600 text-white'
        }`}>
          {toast.msg}
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

      {/* Goal display — primary information hierarchy */}
      <div className="card">
        <GoalDisplay total={total} goal={dailyGoal} />
      </div>

      {/* Quick add */}
      <div className="card">
        <QuickAdd onAdd={handleQuickAdd} submitting={submitting} />
      </div>

      {/* Food library log form */}
      <div className="card">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-3">Log from Food Library</p>
        <form onSubmit={handleLog} className="space-y-4">
          {!selectedFood ? (
            <div>
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
