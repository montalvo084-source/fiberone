import { useState } from 'react';

export default function FoodLibrary({ foods, onFoodsChanged }) {
  const [name, setName] = useState('');
  const [fiber, setFiber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim() || !fiber) return;
    setSubmitting(true);
    try {
      await fetch('/api/foods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), fiber: parseFloat(fiber) }),
      });
      setName('');
      setFiber('');
      onFoodsChanged();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await fetch(`/api/foods/${id}`, { method: 'DELETE' });
      onFoodsChanged();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Add food form */}
      <div className="card">
        <h2 className="font-bold text-emerald-800 text-lg mb-4">Add a Food</h2>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 block">
              Food Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Pear, Kidney Beans (1 cup)..."
              className="input"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 block">
              Fiber per Serving (grams)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={fiber}
              onChange={e => setFiber(e.target.value)}
              placeholder="e.g. 5.2"
              className="input"
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Adding…' : '+ Add Food'}
          </button>
        </form>
      </div>

      {/* Food list */}
      <div className="card">
        <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide mb-4">
          Your Foods
          <span className="ml-2 bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 text-xs">
            {foods.length}
          </span>
        </h2>

        {foods.length === 0 ? (
          <p className="text-emerald-300 text-sm text-center py-6">No foods yet — add one above!</p>
        ) : (
          <ul className="space-y-2">
            {foods.map(food => (
              <li
                key={food.id}
                className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3 group"
              >
                <div>
                  <p className="font-medium text-emerald-900 text-sm">{food.name}</p>
                  <p className="text-xs text-emerald-500">{food.fiber}g fiber / serving</p>
                </div>
                <button
                  onClick={() => handleDelete(food.id)}
                  disabled={deletingId === food.id}
                  className="btn-danger opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete food"
                >
                  {deletingId === food.id ? '…' : '✕'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-center text-emerald-300">
        Tip: include serving size in the name, e.g. "Black Beans (1 cup)"
      </p>
    </div>
  );
}
