import { useState, useEffect } from 'react';
import DailyLog from './components/DailyLog.jsx';
import WeeklyView from './components/WeeklyView.jsx';
import FoodLibrary from './components/FoodLibrary.jsx';
import Settings from './components/Settings.jsx';

const TABS = [
  { id: 'daily', label: '📅 Daily' },
  { id: 'weekly', label: '📊 Weekly' },
  { id: 'foods', label: '🥦 Foods' },
  { id: 'settings', label: '⚙️ Goals' },
];

export default function App() {
  const [tab, setTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [foods, setFoods] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({ dailyGoal: 25 });

  useEffect(() => {
    fetchFoods();
    fetchLogs();
    fetchSettings();
  }, []);

  async function fetchFoods() {
    const res = await fetch('/api/foods');
    setFoods(await res.json());
  }

  async function fetchLogs() {
    const res = await fetch('/api/logs');
    setLogs(await res.json());
  }

  async function fetchSettings() {
    const res = await fetch('/api/settings');
    setSettings(await res.json());
  }

  function navigateToDate(date) {
    setSelectedDate(date);
    setTab('daily');
  }

  return (
    <div className="min-h-screen bg-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-emerald-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <h1 className="text-xl font-bold text-emerald-800 tracking-tight">FiberOne</h1>
          </div>
          <nav className="flex gap-1 bg-emerald-50 p-1 rounded-2xl">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`tab ${tab === t.id ? 'tab-active' : 'tab-inactive'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {tab === 'daily' && (
          <DailyLog
            foods={foods}
            logs={logs}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onLogAdded={fetchLogs}
            onLogRemoved={fetchLogs}
            dailyGoal={settings.dailyGoal}
          />
        )}
        {tab === 'weekly' && (
          <WeeklyView
            logs={logs}
            onDayClick={navigateToDate}
            dailyGoal={settings.dailyGoal}
          />
        )}
        {tab === 'foods' && (
          <FoodLibrary
            foods={foods}
            onFoodsChanged={fetchFoods}
          />
        )}
        {tab === 'settings' && (
          <Settings
            settings={settings}
            onSettingsSaved={fetchSettings}
          />
        )}
      </main>
    </div>
  );
}
