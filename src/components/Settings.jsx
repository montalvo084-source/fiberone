import { useState, useEffect } from 'react';

export default function Settings({ settings, onSettingsSaved }) {
  const [goalInput, setGoalInput] = useState(String(settings.dailyGoal));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setGoalInput(String(settings.dailyGoal));
  }, [settings.dailyGoal]);

  const parsed = parseInt(goalInput, 10);
  const isValid = !isNaN(parsed) && parsed >= 1 && parsed <= 200;

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyGoal: parsed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Save failed');
        return;
      }
      await onSettingsSaved();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function step(delta) {
    const next = Math.min(200, Math.max(1, (parsed || 25) + delta));
    setGoalInput(String(next));
  }

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="font-bold text-emerald-800 text-lg mb-6">Goals & Settings</h2>

        {/* Daily goal stepper */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 block">
            Daily Fiber Goal (grams)
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              className="w-10 h-10 rounded-xl border border-emerald-200 bg-white text-emerald-600 font-bold text-lg hover:bg-emerald-50 active:scale-95 transition-all"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max="200"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              className="input text-center text-lg font-bold w-24"
            />
            <button
              type="button"
              onClick={() => step(1)}
              className="w-10 h-10 rounded-xl border border-emerald-200 bg-white text-emerald-600 font-bold text-lg hover:bg-emerald-50 active:scale-95 transition-all"
            >
              +
            </button>
          </div>
          <p className="text-xs text-emerald-400 mt-2">Recommended: 25–38g/day</p>
          {!isValid && goalInput !== '' && (
            <p className="text-xs text-red-400 mt-1">Enter a number between 1 and 200</p>
          )}
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        <div className="border-t border-emerald-100 pt-6 mb-6">
          <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 block">
            Weekly Goal (calculated)
          </label>
          <div className="bg-emerald-50 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-emerald-700">
              {isValid ? parsed * 7 : '—'}
              <span className="text-sm font-normal text-emerald-400 ml-1">g / week</span>
            </p>
          </div>
          <p className="text-xs text-emerald-400 mt-2">Automatically 7 × your daily goal</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isValid}
          className="btn-primary w-full"
        >
          {saving ? 'Saving…' : 'Save Goal'}
        </button>

        {saved && (
          <p className="text-center text-sm font-semibold text-emerald-600 mt-3 animate-bounce">
            Saved!
          </p>
        )}
      </div>
    </div>
  );
}
