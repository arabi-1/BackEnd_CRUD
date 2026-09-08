import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { readFile } from 'node:fs/promises';
import Database from 'better-sqlite3';

// --- STAGE 0: DATABASE SETUP ---
const db = new Database('tasks.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT,
    done INTEGER DEFAULT 0
  )
`);

const rowCount = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
if (rowCount.count === 0) {
    const insertTask = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
    insertTask.run('Learn Node', 1);
    insertTask.run('Build API', 0);
    insertTask.run('Push to GitHub', 0);
}

// --- EXPRESS & SWAGGER SETUP ---
const swaggerDocument = JSON.parse(
    await readFile(new URL('./openapi.json', import.meta.url))
);

const app = express();
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- ENDPOINTS ---

app.get('/', (req, res) => {
    res.status(200).json({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks", "/docs"] });
});

app.get('/health', (req, res) => {
    res.status(200).json({ "status": "ok" });
});

// Stage 1: GET /tasks (all tasks)
app.get('/tasks', (req, res) => {
    const allTasks = db.prepare('SELECT * FROM tasks').all();
    res.status(200).json(allTasks);
});

// Stage 1: GET /tasks/:id (single task)
app.get('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (task) {
        res.status(200).json(task);
    } else {
        res.status(404).json({ "error": "Task not found" });
    }
});

// Stage 2: POST /tasks (Create new task)
app.post('/tasks', (req, res) => {
    if (!req.body.title || req.body.title.trim() === '') {
        return res.status(400).json({ "error": "Title is required" });
    }

    const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
    const info = insert.run(req.body.title, 0);

    const newTask = {
        id: info.lastInsertRowid,
        title: req.body.title,
        done: false
    };

    res.status(201).json(newTask);
});

// Stage 3: PUT /tasks/:id (Update task)
app.put('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const currentTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    if (!currentTask) {
        return res.status(404).json({ "error": `Task ${id} not found` });
    }

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ "error": "Empty or invalid update body" });
    }

    let newTitle = currentTask.title;
    let newDone = currentTask.done;

    if (req.body.title !== undefined) {
        if (req.body.title.trim() === '') {
            return res.status(400).json({ "error": "Title cannot be empty" });
        }
        newTitle = req.body.title;
    }

    if (req.body.done !== undefined) {
        newDone = req.body.done ? 1 : 0;
    }

    db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    updatedTask.done = updatedTask.done === 1;
    res.status(200).json(updatedTask);
});

// Stage 3: DELETE /tasks/:id (Delete task)
app.delete('/tasks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);

    if (info.changes === 0) {
        return res.status(404).json({ "error": `Task ${id} not found` });
    }

    res.status(204).send();
});

// Fallback for missing pages
app.use((req, res) => {
    res.status(404).json({ "error": "Not Found" });
});

// Start the server
app.listen(3000, '127.0.0.1', () => {
    console.log('Listening on http://127.0.0.1:3000');
    console.log('Swagger documentation available at http://127.0.0.1:3000/docs');
});