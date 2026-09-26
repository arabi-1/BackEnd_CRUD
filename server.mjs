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
        res.writeHead(200);
        res.end(JSON.stringify(tasks));
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

            const newTask = {
                id: tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1,
                title: parsedData.title,
                done: false
            };

            tasks.push(newTask);

            res.writeHead(201);
            res.end(JSON.stringify(newTask));
        });
    }
    // Stages 2 & 4: GET, PUT, DELETE for a specific task by ID
    else if (req.url.startsWith('/tasks/')) {
        const id = parseInt(req.url.split('/')[2]);
        const taskIndex = tasks.findIndex(t => t.id === id);

        // If ID is not found, always return 404
        if (taskIndex === -1) {
            res.writeHead(404);
            return res.end(JSON.stringify({ "error": `Task ${id} not found` }));
        }

        // GET /tasks/:id
        if (req.method === 'GET') {
            res.writeHead(200);
            res.end(JSON.stringify(tasks[taskIndex]));
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

                // Update fields if they are provided
                if (parsedData.title !== undefined) {
                    if (parsedData.title.trim() === '') {
                        res.writeHead(400);
                        return res.end(JSON.stringify({ "error": "Title cannot be empty" }));
                    }
                    tasks[taskIndex].title = parsedData.title;
                }
                if (parsedData.done !== undefined) {
                    tasks[taskIndex].done = Boolean(parsedData.done);
                }

                res.writeHead(200);
                res.end(JSON.stringify(tasks[taskIndex]));
            });
        }
        // DELETE /tasks/:id
        else if (req.method === 'DELETE') {
            tasks.splice(taskIndex, 1);
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