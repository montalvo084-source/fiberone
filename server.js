import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = join(__dirname, 'data', 'db.json');

app.use(express.json());

const SEED_FOODS = [
  { id: randomUUID(), name: 'Apple', fiber: 4.4 },
  { id: randomUUID(), name: 'Banana', fiber: 3.1 },
  { id: randomUUID(), name: 'Avocado', fiber: 10.0 },
  { id: randomUUID(), name: 'Oats (100g)', fiber: 10.0 },
  { id: randomUUID(), name: 'Black Beans (1 cup)', fiber: 15.0 },
  { id: randomUUID(), name: 'Lentils (1 cup)', fiber: 15.6 },
  { id: randomUUID(), name: 'Broccoli (1 cup)', fiber: 5.0 },
  { id: randomUUID(), name: 'Chia Seeds (1 tbsp)', fiber: 5.0 },
  { id: randomUUID(), name: 'Almonds (1 oz)', fiber: 3.5 },
  { id: randomUUID(), name: 'Sweet Potato', fiber: 3.8 },
];

function readDB() {
  if (!existsSync(DB_PATH)) {
    const initial = { foods: SEED_FOODS, logs: [] };
    writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const DEFAULT_SETTINGS = { dailyGoal: 25 };

function readSettings() {
  const db = readDB();
  if (!db.settings) {
    db.settings = { ...DEFAULT_SETTINGS };
    writeDB(db);
  }
  return db.settings;
}

// Foods
app.get('/api/foods', (req, res) => {
  const db = readDB();
  res.json(db.foods);
});

app.post('/api/foods', (req, res) => {
  const { name, fiber } = req.body;
  if (!name || fiber == null) return res.status(400).json({ error: 'name and fiber required' });
  const db = readDB();
  const food = { id: randomUUID(), name: name.trim(), fiber: parseFloat(fiber) };
  db.foods.push(food);
  writeDB(db);
  res.status(201).json(food);
});

app.delete('/api/foods/:id', (req, res) => {
  const db = readDB();
  db.foods = db.foods.filter(f => f.id !== req.params.id);
  writeDB(db);
  res.json({ ok: true });
});

// Logs
app.get('/api/logs', (req, res) => {
  const db = readDB();
  res.json(db.logs);
});

app.post('/api/logs', (req, res) => {
  const { foodId, servings, date } = req.body;
  if (!foodId || !servings || !date) return res.status(400).json({ error: 'foodId, servings, date required' });
  const db = readDB();
  const food = db.foods.find(f => f.id === foodId);
  if (!food) return res.status(404).json({ error: 'food not found' });
  const entry = {
    id: randomUUID(),
    foodId,
    foodName: food.name,
    servings: parseFloat(servings),
    fiber: Math.round(food.fiber * parseFloat(servings) * 10) / 10,
    date,
  };
  db.logs.push(entry);
  writeDB(db);
  res.status(201).json(entry);
});

app.delete('/api/logs/:id', (req, res) => {
  const db = readDB();
  db.logs = db.logs.filter(l => l.id !== req.params.id);
  writeDB(db);
  res.json({ ok: true });
});

// Settings
app.get('/api/settings', (req, res) => {
  res.json(readSettings());
});

app.put('/api/settings', (req, res) => {
  const { dailyGoal } = req.body;
  if (!dailyGoal || typeof dailyGoal !== 'number' || dailyGoal < 1) {
    return res.status(400).json({ error: 'dailyGoal must be a positive number' });
  }
  const db = readDB();
  db.settings = { ...DEFAULT_SETTINGS, ...db.settings, dailyGoal };
  writeDB(db);
  res.json(db.settings);
});

// Serve production build
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`FiberOne server running on http://localhost:${PORT}`);
});
