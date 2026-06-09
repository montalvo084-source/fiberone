import { useMemo } from 'react';

const DAILY_GOAL = 25;
const WEEKLY_GOAL = 175;

function getWeekDates(anchorDate) {
  const [y, m, d] = anchorDate.split('-').map(Number);
  const anchor = new Date(y, m - 1, d);
  const day = anchor.getDay();
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date.toISOString().slice(0, 10);
  });
}

function shortDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
}

function dayNum(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDate();
}

export default function WeeklyView({ logs, onDayClick }) {
  const today = new Date().toISOString().slice(0, 10);
  const weekDates = useMemo(() => getWeekDates(today), [today]);

  const dailyTotals = useMemo(() => {
    const map = {};
    weekDates.forEach(d => { map[d] = 0; });
    logs.forEach(l => {
      if (map[l.date] !== undefined) map[l.date] += l.fiber;
    });
    return map;
  }, [logs, weekDates]);

  const weekTotal = useMemo(
    () => Object.values(dailyTotals).reduce((s, v) => s + v, 0),
    [dailyTotals]
  );

  const weekPct = Math.min(weekTotal / WEEKLY_GOAL, 1);

  return (
    <div className="space-y-5">
      {/* Weekly summary */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-emerald-800 text-lg">This Week</h2>
          <span className="text-sm text-emerald-500">
            {weekTotal.toFixed(1)}g / {WEEKLY_GOAL}g
          </span>
        </div>

        {/* Weekly progress bar */}
        <div className="w-full bg-emerald-100 rounded-full h-3 mb-1">
          <div
            className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
            style={{ width: `${weekPct * 100}%` }}
          />
        </div>
        <p className="text-xs text-emerald-400 text-right">{Math.round(weekPct * 100)}% of weekly goal</p>

        {weekTotal >= WEEKLY_GOAL && (
          <p className="text-emerald-600 font-semibold text-sm text-center mt-2">
            🏆 Weekly goal achieved!
          </p>
        )}
      </div>

      {/* Day grid */}
      <div className="card">
        <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-5">Daily Breakdown</h2>

        <div className="grid grid-cols-7 gap-2">
          {weekDates.map(date => {
            const fiber = dailyTotals[date] || 0;
            const pct = Math.min(fiber / DAILY_GOAL, 1);
            const isToday = date === today;
            const isFuture = date > today;
            const isHit = fiber >= DAILY_GOAL;

            return (
              <button
                key={date}
                onClick={() => !isFuture && onDayClick(date)}
                disabled={isFuture}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-150 ${
                  isFuture
                    ? 'opacity-30 cursor-default'
                    : 'hover:bg-emerald-50 cursor-pointer active:scale-95'
                } ${isToday ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}
              >
                <span className="text-xs text-emerald-400 font-medium">{shortDay(date)}</span>
                <span className={`text-sm font-bold ${isToday ? 'text-emerald-700' : 'text-emerald-600'}`}>
                  {dayNum(date)}
                </span>

                {/* Bar */}
                <div className="w-full bg-emerald-100 rounded-full h-16 flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-full transition-all duration-700 ${isHit ? 'bg-emerald-600' : 'bg-emerald-400'}`}
                    style={{ height: `${Math.max(pct * 100, fiber > 0 ? 8 : 0)}%` }}
                  />
                </div>

                <span className={`text-xs font-semibold ${isHit ? 'text-emerald-700' : 'text-emerald-500'}`}>
                  {fiber > 0 ? `${fiber.toFixed(0)}g` : '—'}
                </span>
                {isHit && <span className="text-xs">✅</span>}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-emerald-300 text-center mt-4">
          Tap a day to view its log
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Days Hit Goal',
            value: weekDates.filter(d => (dailyTotals[d] || 0) >= DAILY_GOAL).length,
            suffix: '/ 7',
          },
          {
            label: 'Daily Avg',
            value: (weekTotal / 7).toFixed(1),
            suffix: 'g',
          },
          {
            label: 'Best Day',
            value: Math.max(...Object.values(dailyTotals)).toFixed(1),
            suffix: 'g',
          },
        ].map(stat => (
          <div key={stat.label} className="card text-center py-4">
            <p className="text-2xl font-bold text-emerald-600">
              {stat.value}<span className="text-sm font-normal text-emerald-400 ml-0.5">{stat.suffix}</span>
            </p>
            <p className="text-xs text-emerald-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
