import { createServer } from 'node:http';



import Database from 'better-sqlite3';

// 1. Open (or create) the SQLite database file
const db = new Database('tasks.db');

// 2. Create the tasks table if it doesn't already exist
db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT    NOT NULL,
        done  INTEGER DEFAULT 0
    )
`);

// 3. Seed three example tasks only when the table is empty
const { 'COUNT(*)': count } = db.prepare('SELECT COUNT(*) FROM tasks').get();
if (count === 0) {
    const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
    insert.run('Learn Node', 1);
    insert.run('Build API', 0);
    insert.run('Push to GitHub', 0);
}

const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    // Stage 1: Root endpoint
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200);
        res.end(JSON.stringify({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] }));
    }
    // Stage 1: Health endpoint
    else if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ "status": "ok" }));
    }
    // Stage 2: GET /tasks (all tasks)
    else if (req.method === 'GET' && req.url === '/tasks') {
        const rows = db.prepare('SELECT * FROM tasks').all();
        const allTasks = rows.map(row => ({ ...row, done: row.done === 1 }));
        res.writeHead(200);
        res.end(JSON.stringify(allTasks));
    }
    // Stage 3: POST /tasks (Create new task)
    else if (req.method === 'POST' && req.url === '/tasks') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            let parsedData;
            try {
                parsedData = body ? JSON.parse(body) : {};
            } catch (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ "error": "Invalid JSON format" }));
            }

            if (!parsedData.title || parsedData.title.trim() === '') {
                res.writeHead(400);
                return res.end(JSON.stringify({ "error": "Title is required" }));
            }

            const { lastInsertRowid } = db.prepare('INSERT INTO tasks (title, done) VALUES (?, 0)').run(parsedData.title);
            const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(lastInsertRowid);

            res.writeHead(201);
            res.end(JSON.stringify({ ...newTask, done: newTask.done === 1 }));
        });
    }
    // Stages 2 & 4: GET, PUT, DELETE for a specific task by ID
    else if (req.url.startsWith('/tasks/')) {
        const id = parseInt(req.url.split('/')[2]);

        // GET /tasks/:id
        if (req.method === 'GET') {
            const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
            if (!task) {
                res.writeHead(404);
                return res.end(JSON.stringify({ "error": "Task not found" }));
            }
            res.writeHead(200);
            res.end(JSON.stringify({ ...task, done: task.done === 1 }));
        }
        // PUT /tasks/:id (Update task)
        else if (req.method === 'PUT') {
            let body = '';

            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                let parsedData;
                try {
                    parsedData = body ? JSON.parse(body) : {};
                } catch (err) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ "error": "Invalid JSON format" }));
                }

                // 400 Bad Request if body is empty
                if (Object.keys(parsedData).length === 0) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ "error": "Empty or invalid update body" }));
                }

                // Validate title if provided
                if (parsedData.title !== undefined && parsedData.title.trim() === '') {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ "error": "Title cannot be empty" }));
                }

                // 404 if the task doesn't exist
                const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
                if (!existing) {
                    res.writeHead(404);
                    return res.end(JSON.stringify({ "error": "Task not found" }));
                }

                // Merge incoming fields onto existing values
                const newTitle = parsedData.title !== undefined ? parsedData.title : existing.title;
                const newDone = parsedData.done !== undefined ? (parsedData.done ? 1 : 0) : existing.done;

                db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(newTitle, newDone, id);

                const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
                res.writeHead(200);
                res.end(JSON.stringify({ ...updatedTask, done: updatedTask.done === 1 }));
            });
        }
        // DELETE /tasks/:id
        else if (req.method === 'DELETE') {
            const { changes } = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
            if (changes === 0) {
                res.writeHead(404);
                return res.end(JSON.stringify({ "error": "Task not found" }));
            }
            res.writeHead(204);
            res.end(); // 204 No Content requires an empty response body
        }
    }
    // Fallback for missing pages
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ "error": "Not Found" }));
    }
});

server.listen(3000, '127.0.0.1', () => {
    console.log('Listening on 127.0.0.1:3000');
});