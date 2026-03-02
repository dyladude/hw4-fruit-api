'use strict';

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global state
let fruits = [
  { id: 1, name: 'apple' },
  { id: 2, name: 'banana' }
];
let nextId = 3;

const normalize = (s) => String(s || '').trim().toLowerCase();

app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/api/fruits', (req, res) => {
  const { id, name, ...rest } = req.query;

  if (Object.keys(rest).length) {
    return res.status(400).json({
      error: 'Unsupported query parameter(s)',
      supported: ['id', 'name'],
      received: Object.keys(rest)
    });
  }

  if (id === undefined && name === undefined) {
    return res.status(200).json({ fruits, count: fruits.length });
  }

  if (id !== undefined) {
    const num = Number(id);
    if (!Number.isInteger(num)) return res.status(400).json({ error: 'id must be an integer' });

    const found = fruits.find(f => f.id === num);
    if (!found) return res.status(404).json({ error: 'Fruit not found', id: num });
    return res.status(200).json(found);
  }

  const n = normalize(name);
  if (!n) return res.status(400).json({ error: 'name must be non-empty' });

  const found = fruits.find(f => f.name === n);
  if (!found) return res.status(404).json({ error: 'Fruit not found', name: n });
  return res.status(200).json(found);
});

app.post('/api/fruits', (req, res) => {
  const name = normalize(req.body.name);

  if (!name) return res.status(400).json({ error: 'Missing required parameter: name' });
  if (fruits.some(f => f.name === name)) return res.status(400).json({ error: 'Fruit already exists', name });

  const created = { id: nextId++, name };
  fruits.push(created);
  return res.status(201).json(created);
});

// Implemented now for next HW:
app.put('/api/fruits/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id must be an integer' });

  const idx = fruits.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Fruit not found', id });

  const name = normalize(req.body.name);
  if (!name) return res.status(400).json({ error: 'Missing required parameter: name' });
  if (fruits.some(f => f.name === name && f.id !== id)) return res.status(400).json({ error: 'Fruit already exists', name });

  fruits[idx].name = name;
  return res.status(200).json(fruits[idx]);
});

app.delete('/api/fruits/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id must be an integer' });

  const idx = fruits.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Fruit not found', id });

  fruits.splice(idx, 1);
  return res.status(204).send();
});

// Listen locally; nginx proxies to it
const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Fruit API listening on http://127.0.0.1:${PORT}`);
});
